import fetch from 'node-fetch';

// 測試 getByOrderNumber 程序
const testOrderNumber = '260422-01'; // 替換為實際的訂單編號

const query = `
  query {
    order {
      getByOrderNumber(orderNumber: "${testOrderNumber}") {
        id
        orderNumber
        customerId
        bagCount
      }
    }
  }
`;

console.log('Testing getByOrderNumber with:', testOrderNumber);
console.log('Query:', query);
