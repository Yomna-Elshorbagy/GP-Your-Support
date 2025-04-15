export const roles = {
  USER: "user",
  VISITOR: "visitor",
  ADMIN: "admin",
};
Object.freeze(roles);

export const status = {
  BLOCKED: "blocked",
  PENDING: "pending",
  VERIFIED: "verified",
  DELETED: "deleted",
};
Object.freeze(status);

export const orderStatus = {
  PLACED: "placed",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELED: "canceled",
  REFUNDED: "refund",
};
Object.freeze(orderStatus);

export const payments = {
  CASH: "cash",
  VISA: "visa",
};
Object.freeze(payments);
