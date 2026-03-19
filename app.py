# -*- coding: utf-8 -*-
"""
汽修门店智能营销工具 - 单文件完整版
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, date
import sqlite3
import os
import re
from io import StringIO

# ==================== 数据库模块 ====================

DATABASE_PATH = "customers.db"

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """初始化数据库"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            plate_number TEXT,
            car_brand TEXT,
            car_model TEXT,
            car_age INTEGER,
            mileage INTEGER,
            gender TEXT,
            age INTEGER,
            last_visit_date DATE,
            service_records TEXT,
            maintenance_records TEXT,
            last_maintenance_mileage INTEGER,
            last_maintenance_date DATE,
            customer_type TEXT,
            tags TEXT,
            recommended_template TEXT,
            recommended_reason TEXT,
            is_marketed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def add_customer(customer_data):
    """添加客户"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO customers (
            customer_name, phone, plate_number, car_brand, car_model,
            car_age, mileage, gender, age, last_visit_date,
            service_records, maintenance_records, last_maintenance_mileage,
            last_maintenance_date, customer_type, tags,
            recommended_template, recommended_reason, is_marketed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        customer_data.get('customer_name'),
        customer_data.get('phone'),
        customer_data.get('plate_number'),
        customer_data.get('car_brand'),
        customer_data.get('car_model'),
        customer_data.get('car_age'),
        customer_data.get('mileage'),
        customer_data.get('gender'),
        customer_data.get('age'),
        customer_data.get('last_visit_date'),
        customer_data.get('service_records'),
        customer_data.get('maintenance_records'),
        customer_data.get('last_maintenance_mileage'),
        customer_data.get('last_maintenance_date'),
        customer_data.get('customer_type'),
        customer_data.get('tags'),
        customer_data.get('recommended_template'),
        customer_data.get('recommended_reason'),
        customer_data.get('is_marketed', 0)
    ))
    
    customer_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return customer_id

def get_all_customers():
    """获取所有客户"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM customers ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_customer_by_id(customer_id):
    """根据ID获取客户"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_brand_distribution():
    """获取品牌分布"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT car_brand as brand, COUNT(*) as count
        FROM customers
        WHERE car_brand IS NOT NULL AND car_brand != ""
        GROUP BY car_brand
        ORDER BY count DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [{'brand': row['brand'], 'count': row['count']} for row in rows]

def get_customer_type_distribution():
    """获取客户类型分布"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT customer_type as type, COUNT(*) as count
        FROM customers
        WHERE customer_type IS NOT NULL AND customer_type != ""
        GROUP BY customer_type
        ORDER BY count DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [{'type': row['type'], 'count': row['count']} for row in rows]

def update_customer(customer_id, customer_data):
    """更新客户"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    customer_data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    set_clauses = []
    values = []
    for key, value in customer_data.items():
        if key not in ['id', 'created_at']:
            set_clauses.append(f"{key} = ?")
            values.append(value)
    
    values.append(customer_id)
    
    cursor.execute(f'UPDATE customers SET {", ".join(set_clauses)} WHERE id = ?', values)
    
    conn.commit()
    conn.close()

def check_duplicate_phone(phone):
    """检查手机号是否重复"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM customers WHERE phone = ?', (phone,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

# ==================== Excel导入模块 ====================

class ExcelImporter:
    """Excel导入处理器"""
    
    FIELD_MAPPING = {
        'customer_name': ['客户姓名', '姓名', '客户名称', '车主姓名', 'name'],
        'phone': ['手机号', '手机', '电话号码', '联系电话', '电话', 'TEL'],
        'plate_number': ['车牌号', '车牌', '牌照', '车牌号码'],
        'car_brand': ['汽车品牌', '品牌', '车辆品牌', '厂商'],
        'car_model': ['车型', '车系', '车辆型号', '车款'],
        'car_age': ['车龄', '车辆年龄'],
        'mileage': ['里程', '公里数', '行驶里程', '总里程', '公里'],
        'gender': ['性别', '男', '女'],
        'age': ['年龄', '客户年龄'],
        'last_visit_date': ['最近到店日期', '最后到店日期', '上次到店日期', '到店日期'],
        'maintenance_records': ['保养记录', '保养历史'],
        'service_records': ['维修记录', '维修历史'],
        'last_maintenance_mileage': ['上次保养里程', '保养里程'],
        'last_maintenance_date': ['上次保养日期', '保养日期']
    }
    
    def __init__(self):
        self.df = None
        self.column_mapping = {}
    
    def load_file(self, uploaded_file):
        """加载文件"""
        try:
            self.df = pd.read_excel(uploaded_file, engine='openpyxl')
            self.df.columns = [col.strip() if isinstance(col, str) else str(col) for col in self.df.columns]
            return True, f"成功加载文件，共{len(self.df)}行数据"
        except Exception as e:
            return False, f"加载文件失败：{str(e)}"
    
    def auto_detect_columns(self):
        """自动检测列名"""
        detected_mapping = {}
        
        for col_name in self.df.columns:
            col_clean = col_name.strip().upper()
            
            for standard_field, variants in self.FIELD_MAPPING.items():
                for variant in variants:
                    if col_clean == variant.upper():
                        detected_mapping[col_name] = standard_field
                        break
        
        self.column_mapping = detected_mapping
        return detected_mapping
    
    def validate_phone(self, phone):
        """验证手机号"""
        if pd.isna(phone) or str(phone).strip() == '':
            return False, "手机号不能为空"
        
        phone_clean = re.sub(r'[\s\-\(\)\（\）]', '', str(phone).strip())
        
        if not re.match(r'^1[3-9]\d{9}$', phone_clean):
            return False, f"手机号格式不正确：{phone}"
        
        return True, phone_clean
    
    def validate_field(self, field_name, value):
        """验证字段"""
        if pd.isna(value) or str(value).strip() == '':
            if field_name in ['customer_name', 'phone']:
                return False, None, f"{field_name}为必填字段"
            return True, None, ""
        
        value_clean = str(value).strip()
        
        if field_name == 'phone':
            return self.validate_phone(value)
        elif field_name in ['car_age', 'mileage', 'age']:
            try:
                return True, int(float(value_clean)), ""
            except:
                return True, None, ""
        elif field_name == 'last_visit_date' or field_name == 'last_maintenance_date':
            try:
                parsed_date = pd.to_datetime(value)
                return True, parsed_date.strftime('%Y-%m-%d'), ""
            except:
                return True, None, ""
        
        return True, value_clean, ""
    
    def transform_data(self):
        """转换数据"""
        records = []
        errors = []
        
        for idx, row in self.df.iterrows():
            record = {}
            row_errors = []
            
            for original_col, standard_field in self.column_mapping.items():
                value = row.get(original_col)
                is_valid, cleaned_value, error_msg = self.validate_field(standard_field, value)
                
                if not is_valid:
                    row_errors.append(f"行{idx+2}: {error_msg}")
                    continue
                
                if cleaned_value is not None:
                    record[standard_field] = cleaned_value
            
            if 'customer_name' not in record:
                row_errors.append(f"行{idx+2}: 缺少客户姓名")
            if 'phone' not in record:
                row_errors.append(f"行{idx+2}: 缺少手机号")
            
            if row_errors:
                errors.extend(row_errors)
                continue
            
            if check_duplicate_phone(record['phone']):
                continue
            
            records.append(record)
        
        return records, errors
    
    def import_to_database(self, file_name):
        """导入到数据库"""
        records, errors = self.transform_data()
        
        success_count = 0
        for record in records:
            try:
                add_customer(record)
                success_count += 1
            except:
                pass
        
        return {
            'total': len(self.df),
            'success': success_count,
            'fail': len(errors),
            'errors': errors[:20]
        }

# ==================== 营销引擎模块 ====================

class MarketingEngine:
    """营销方案匹配引擎"""
    
    TEMPLATES = {
        '流失召回_B': {
            'name': '流失召回B方案（高优先级）',
            'priority': 'high',
            'color': '#FF6B6B',
            'title': '【流失召回】尊敬的车主，您已很久未到店',
            'content': '''您的爱车已有一段时间未进行检测，为保障您的行车安全，我们为您准备了以下专属服务：

1. 免费全车安全检测（价值199元）
2. 保养套餐8折优惠
3. 优先预约，无需等待

我们期待您的回访，如有任何问题欢迎随时联系。祝您行车安全！''',
            'tips': '60天以上未到店的高流失风险客户'
        },
        '流失召回_A': {
            'name': '流失召回A方案',
            'priority': 'medium',
            'color': '#FFA500',
            'title': '【保养提醒】您的爱车需要关注啦',
            'content': '''亲爱的车主，您的爱车已有一段时间未到店，我们非常想念您！

现在回店可享受以下专属优惠：
1. 全车免费检测一次
2. 常规保养可享9折
3. 免费添加玻璃水

期待您的回访！''',
            'tips': '30-60天未到店的流失风险客户'
        },
        '保养提醒': {
            'name': '保养到期提醒',
            'priority': 'high',
            'color': '#4ECDC4',
            'title': '【保养提醒】您的爱车该做保养了',
            'content': '''尊敬的车主，根据您的用车情况，您的爱车已达到保养周期。

我们建议您尽快到店进行专业保养，服务项目包括：
1. 机油及机滤更换
2. 全车安全检测
3. 轮胎气压检查

现在预约可享保养套餐优惠！''',
            'tips': '基于里程或时间判断的保养到期客户'
        },
        '新客激活': {
            'name': '新客激活方案',
            'priority': 'medium',
            'color': '#45B7D1',
            'title': '【新客优惠】欢迎成为我们的车主',
            'content': '''感谢您选择我们！作为新客户，您将享受以下专属服务：

1. 首次到店免费全车检测
2. 保养套餐8折优惠
3. 专业技师一对一定制保养方案

我们期待为您提供专业、贴心的服务！''',
            'tips': '新导入且7天内未消费的客户'
        },
        '高价值维护': {
            'name': 'VIP客户维护方案',
            'priority': 'medium',
            'color': '#DDA0DD',
            'title': '【VIP专属】感谢您一直以来的信任',
            'content': '''尊敬的金卡会员，感谢您一直对我们的支持与信任！

作为VIP会员，您享有以下专属权益：
1. 免费上门取送车服务
2. 优先预约通道
3. 保养积分双倍

我们将继续为您提供最优质的服务！''',
            'tips': '高端品牌客户'
        },
        '节日关怀': {
            'name': '节日关怀方案',
            'priority': 'low',
            'color': '#95E1D3',
            'title': '【节日祝福】佳节将至，祝您节日快乐',
            'content': '''尊敬的车主，佳节将至，祝您节日快乐！

为感谢您一直以来的支持，本月到店可享受：
1. 全系保养8折优惠
2. 免费添加玻璃水

欢迎回店体验！''',
            'tips': '节假日前发送'
        },
        '定期保养': {
            'name': '定期保养方案',
            'priority': 'low',
            'color': '#90EE90',
            'title': '【定期关怀】您的爱车，我们时刻关注',
            'content': '''尊敬的车主，定期保养能让您的爱车保持最佳状态。

我们建议您：
1. 每半年或每5000公里进行一次专业保养
2. 定期检查轮胎气压和刹车系统

欢迎随时预约回店！''',
            'tips': '默认方案'
        }
    }
    
    def calculate_days_since_visit(self, last_visit_date):
        """计算距上次到店天数"""
        if not last_visit_date:
            return None
        try:
            last_date = datetime.strptime(last_visit_date, '%Y-%m-%d').date()
            return (date.today() - last_date).days
        except:
            return None
    
    def check_maintenance_due(self, customer):
        """检查保养是否到期"""
        results = {'is_due': False, 'messages': []}
        
        last_mileage = customer.get('last_maintenance_mileage')
        current_mileage = customer.get('mileage')
        last_date = customer.get('last_maintenance_date')
        
        if last_mileage and current_mileage:
            interval = current_mileage - last_mileage
            if interval >= 5000:
                results['is_due'] = True
                results['messages'].append(f'已行驶{interval}公里，建议立即保养')
            elif interval >= 4500:
                results['messages'].append(f'已行驶{interval}公里，即将需要保养')
        
        if last_date:
            try:
                last = datetime.strptime(last_date, '%Y-%m-%d').date()
                months = (date.today() - last).days / 30
                if months >= 6:
                    results['is_due'] = True
                    results['messages'].append(f'已{int(months)}个月未保养')
            except:
                pass
        
        return results
    
    def match_template(self, customer):
        """匹配营销方案"""
        days_since_visit = self.calculate_days_since_visit(customer.get('last_visit_date'))
        maintenance_info = self.check_maintenance_due(customer)
        
        # 流失风险60天以上
        if days_since_visit and days_since_visit > 60:
            return '流失召回_B', f'已{days_since_visit}天未到店，流失风险高'
        
        # 保养到期
        if maintenance_info['is_due']:
            return '保养提醒', '、'.join(maintenance_info['messages'][:2])
        
        # 流失风险30-60天
        if days_since_visit and days_since_visit > 30:
            return '流失召回_A', f'已{days_since_visit}天未到店，需要关注'
        
        # 高端品牌客户
        car_brand = customer.get('car_brand', '')
        if car_brand in ['宝马', '奔驰', '奥迪', '保时捷', '雷克萨斯']:
            return '高价值维护', '高端品牌客户，需重点维护'
        
        # 默认
        return '定期保养', '常规客户，定期关怀'
    
    def generate_tags(self, customer):
        """生成客户标签"""
        tags = []
        
        days_since_visit = self.calculate_days_since_visit(customer.get('last_visit_date'))
        if days_since_visit is not None:
            if days_since_visit > 60:
                tags.append('流失高风险')
            elif days_since_visit > 30:
                tags.append('流失风险')
            elif days_since_visit > 7:
                tags.append('活跃度下降')
            else:
                tags.append('活跃客户')
        
        car_brand = customer.get('car_brand', '')
        if car_brand in ['宝马', '奔驰', '奥迪', '保时捷', '雷克萨斯']:
            tags.append('高端品牌')
        elif car_brand in ['大众', '丰田', '本田', '日产']:
            tags.append('主流品牌')
        
        mileage = customer.get('mileage', 0)
        if mileage > 100000:
            tags.append('高里程')
        elif mileage > 50000:
            tags.append('中里程')
        
        return tags
    
    def determine_customer_type(self, customer):
        """确定客户类型"""
        days_since_visit = self.calculate_days_since_visit(customer.get('last_visit_date'))
        
        if days_since_visit is not None:
            if days_since_visit > 60:
                return '流失风险'
            elif days_since_visit > 30:
                return '流失预警'
            elif days_since_visit > 7:
                return '一般客户'
            else:
                return '活跃客户'
        
        return '新客户'
    
    def process_all_customers(self, customers):
        """处理所有客户"""
        results = []
        
        for customer in customers:
            template_type, reason = self.match_template(customer)
            template = self.TEMPLATES.get(template_type, self.TEMPLATES['定期保养'])
            tags = self.generate_tags(customer)
            customer_type = self.determine_customer_type(customer)
            
            result = {
                'customer_id': customer.get('id'),
                'customer_name': customer.get('customer_name'),
                'phone': customer.get('phone'),
                'plate_number': customer.get('plate_number'),
                'car_info': f"{customer.get('car_brand', '')} {customer.get('car_model', '')}".strip(),
                'customer_type': customer_type,
                'tags': ','.join(tags),
                'template_type': template_type,
                'template_name': template['name'],
                'template_title': template['title'],
                'template_content': template['content'],
                'priority': template['priority'],
                'reason': reason
            }
            
            results.append(result)
            
            # 更新客户记录
            update_customer(customer['id'], {
                'tags': result['tags'],
                'customer_type': result['customer_type'],
                'recommended_template': result['template_name'],
                'recommended_reason': result['reason'],
                'is_marketed': 1
            })
        
        return results

# ==================== Streamlit界面 ====================

st.set_page_config(
    page_title="汽修门店智能营销工具",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 初始化
init_database()

# 侧边栏导航
st.sidebar.title("📋 功能菜单")

page = st.sidebar.selectbox(
    "选择功能",
    ["🏠 首页概览", "👥 客户管理", "📥 导入客户", "📝 营销推荐", "📊 数据统计"]
)

# 主界面
if page == "🏠 首页概览":
    st.title("🚗 汽修门店智能营销工具")
    st.markdown("---")
    
    customers = get_all_customers()
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("客户总数", len(customers))
    
    with col2:
        this_month = len([c for c in customers if c.get('created_at', '').startswith(datetime.now().strftime('%Y-%m'))])
        st.metric("本月新增", this_month)
    
    with col3:
        pending = len([c for c in customers if not c.get('is_marketed')])
        st.metric("待营销客户", pending)
    
    with col4:
        risk = len([c for c in customers if c.get('customer_type') == '流失风险'])
        st.metric("流失风险客户", risk)
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🚙 品牌分布")
        brand_data = get_brand_distribution()
        if brand_data:
            df = pd.DataFrame(brand_data)
            fig = px.pie(df, values='count', names='brand', title='客户车辆品牌分布')
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无品牌数据")
    
    with col2:
        st.subheader("👤 客户类型分布")
        type_data = get_customer_type_distribution()
        if type_data:
            df = pd.DataFrame(type_data)
            fig = px.bar(df, x='type', y='count', title='客户类型分布', color='type')
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无客户数据")

elif page == "👥 客户管理":
    st.header("👥 客户管理")
    
    customers = get_all_customers()
    
    search = st.text_input("🔍 搜索客户", placeholder="输入姓名、车牌或手机号...")
    
    if search:
        customers = [c for c in customers 
                    if search.lower() in str(c.get('customer_name', '')).lower()
                    or search.lower() in str(c.get('phone', '')).lower()
                    or search.lower() in str(c.get('plate_number', '')).lower()]
    
    st.markdown(f"**共找到 {len(customers)} 位客户**")
    
    if customers:
        df = pd.DataFrame(customers)
        display_cols = ['id', 'customer_name', 'phone', 'plate_number', 'car_brand', 'customer_type']
        available = [c for c in display_cols if c in df.columns]
        df_display = df[available].copy()
        df_display.columns = ['ID', '姓名', '手机', '车牌', '品牌', '客户类型']
        st.dataframe(df_display, use_container_width=True, hide_index=True)
        
        st.markdown("---")
        st.subheader("📋 客户详情")
        
        selected_id = st.selectbox("选择客户查看详情", 
                                   options=[c['id'] for c in customers],
                                   format_func=lambda x: f"{x} - {[c['customer_name'] for c in customers if c['id']==x][0]}")
        
        if selected_id:
            customer = get_customer_by_id(selected_id)
            if customer:
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write("**基本信息**")
                    st.write(f"• 姓名：{customer.get('customer_name', 'N/A')}")
                    st.write(f"• 手机：{customer.get('phone', 'N/A')}")
                    st.write(f"• 性别：{customer.get('gender', 'N/A')}")
                    st.write(f"• 年龄：{customer.get('age', 'N/A')}岁")
                
                with col2:
                    st.write("**车辆信息**")
                    st.write(f"• 车牌：{customer.get('plate_number', 'N/A')}")
                    st.write(f"• 品牌：{customer.get('car_brand', 'N/A')}")
                    st.write(f"• 车型：{customer.get('car_model', 'N/A')}")
                    st.write(f"• 车龄：{customer.get('car_age', 'N/A')}年")
                    st.write(f"• 里程：{customer.get('mileage', 'N/A')}公里")
                
                st.write("**分析信息**")
                col3, col4 = st.columns(2)
                
                with col3:
                    st.write(f"• 客户类型：{customer.get('customer_type', 'N/A')}")
                    st.write(f"• 标签：{customer.get('tags', 'N/A')}")
                
                with col4:
                    st.write(f"• 最近到店：{customer.get('last_visit_date', 'N/A')}")
                    st.write(f"• 推荐方案：{customer.get('recommended_template', 'N/A')}")
                
                if customer.get('recommended_template'):
                    st.markdown("**📝 推荐营销内容**")
                    st.info(customer.get('recommended_reason', ''))
    else:
        st.info("暂无客户数据，请先导入客户")

elif page == "📥 导入客户":
    st.header("📥 导入客户数据")
    
    st.info("""
    **导入说明：**
    - 必填项：客户姓名、手机号
    - 选填项：车牌号、汽车品牌、车型等
    - 支持.xlsx格式的Excel文件
    """)
    
    uploaded_file = st.file_uploader("选择Excel文件", type=['xlsx', 'xls'])
    
    if uploaded_file:
        importer = ExcelImporter()
        success, message = importer.load_file(uploaded_file)
        
        if success:
            st.success(message)
            
            detected = importer.auto_detect_columns()
            
            if detected:
                st.write("**已识别的字段映射：**")
                for original, standard in detected.items():
                    st.write(f"• **{original}** → **{standard}**")
            
            st.subheader("数据预览（前10行）")
            st.dataframe(importer.df.head(10), use_container_width=True)
            
            st.markdown("---")
            
            if st.button("🚀 开始导入", type="primary", use_container_width=True):
                with st.spinner("正在导入..."):
                    result = importer.import_to_database(uploaded_file.name)
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("总记录数", result['total'])
                with col2:
                    st.metric("成功导入", result['success'])
                with col3:
                    st.metric("失败", result['fail'])
                
                if result['success'] > 0:
                    st.success(f"✅ 成功导入 {result['success']} 条客户数据！")
        else:
            st.error(message)

elif page == "📝 营销推荐":
    st.header("📝 智能营销推荐")
    
    customers = get_all_customers()
    
    if not customers:
        st.warning("暂无客户数据，请先导入客户")
    else:
        if st.button("🚀 为所有客户生成推荐方案", type="primary", use_container_width=True):
            with st.spinner("正在分析客户数据..."):
                engine = MarketingEngine()
                results = engine.process_all_customers(customers)
                st.session_state['results'] = results
                st.success(f"已为 {len(results)} 位客户生成推荐方案！")
        
        if 'results' in st.session_state:
            results = st.session_state['results']
            
            # 按方案类型分组统计
            summary = {}
            for r in results:
                template_type = r['template_type']
                if template_type not in summary:
                    summary[template_type] = {
                        'name': r['template_name'],
                        'priority': r['priority'],
                        'count': 0,
                        'customers': []
                    }
                summary[template_type]['count'] += 1
                summary[template_type]['customers'].append(r)
            
            st.markdown("---")
            st.subheader("📊 推荐结果汇总")
            
            for template_type, info in summary.items():
                with st.expander(f"📋 {info['name']} ({info['count']}人)", expanded=True):
                    col1, col2 = st.columns([1, 3])
                    
                    with col1:
                        st.write(f"**优先级：** {'高' if info['priority']=='high' else '中' if info['priority']=='medium' else '低'}")
                        st.write(f"**客户数：** {info['count']}")
                    
                    with col2:
                        customer_df = pd.DataFrame(info['customers'])
                        st.dataframe(customer_df[['customer_name', 'phone', 'car_info', 'reason']], 
                                   use_container_width=True, hide_index=True)
            
            st.markdown("---")
            
            if st.button("📥 导出推荐结果Excel", use_container_width=True):
                export_df = pd.DataFrame(results)
                export_df.columns = ['客户ID', '姓名', '手机', '车牌', '车型', '客户类型', '标签', 
                                    '方案类型', '方案名称', '营销标题', '营销内容', '优先级', '推荐理由']
                
                output = export_df.to_excel(index=False, engine='openpyxl')
                st.download_button(
                    label="点击下载Excel",
                    data=output,
                    file_name="营销推荐结果.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )

elif page == "📊 数据统计":
    st.header("📊 数据统计分析")
    
    customers = get_all_customers()
    
    if not customers:
        st.warning("暂无客户数据")
    else:
        df = pd.DataFrame(customers)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("客户总数", len(customers))
        with col2:
            active = len([c for c in customers if c.get('customer_type') == '活跃客户'])
            st.metric("活跃客户", active)
        with col3:
            risk = len([c for c in customers if c.get('customer_type') == '流失风险'])
            st.metric("流失风险", risk)
        with col4:
            pending = len([c for c in customers if not c.get('is_marketed')])
            st.metric("待营销", pending)
        
        st.markdown("---")
        
        tab1, tab2 = st.tabs(["品牌分析", "客户分析"])
        
        with tab1:
            if 'car_brand' in df.columns:
                brand_counts = df['car_brand'].value_counts().reset_index()
                brand_counts.columns = ['品牌', '数量']
                
                fig = px.bar(brand_counts, x='品牌', y='数量', title='各品牌客户数量', color='数量')
                st.plotly_chart(fig, use_container_width=True)
        
        with tab2:
            if 'customer_type' in df.columns:
                type_counts = df['customer_type'].value_counts().reset_index()
                type_counts.columns = ['客户类型', '数量']
                
                fig = px.pie(type_counts, values='数量', names='客户类型', title='客户类型分布')
                st.plotly_chart(fig, use_container_width=True)
