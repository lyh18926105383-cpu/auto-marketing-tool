import Dexie from 'dexie';

export const db = new Dexie('AutoRepairDB');

db.version(1).stores({
  customers: 'licensePlate, customerName, carModel, createdAt'
});

export const addOrUpdateCustomer = async (customerData) => {
  const { licensePlate } = customerData;
  const existingCustomer = await db.customers.get(licensePlate);

  if (existingCustomer) {
    // 将现有数据移到 history
    const historyRecord = {
      mileage: existingCustomer.mileage,
      lastDate: existingCustomer.lastDate
    };

    const updatedCustomer = {
      ...customerData,
      history: [...(existingCustomer.history || []), historyRecord],
      updatedAt: new Date().toISOString()
    };

    await db.customers.put(updatedCustomer);
    return { isUpdate: true, customer: updatedCustomer };
  } else {
    const newCustomer = {
      ...customerData,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.customers.add(newCustomer);
    return { isUpdate: false, customer: newCustomer };
  }
};

export const getAllCustomers = async () => {
  return await db.customers.toArray();
};

export const getCustomerByLicensePlate = async (licensePlate) => {
  return await db.customers.get(licensePlate);
};

export const deleteCustomer = async (licensePlate) => {
  return await db.customers.delete(licensePlate);
};

export const clearAllCustomers = async () => {
  return await db.customers.clear();
};
