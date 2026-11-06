import axiosClient from '../api/axiosClient';
import { mapOrder } from './orderService';
import { savedContractUrl } from '../utils/signedContract';
const path = (id) => `/account/orders/${encodeURIComponent(id)}`;
export const getOrders = async () => (await axiosClient.get('/account/orders')).data.map(mapOrder);
export const getOrder = async (id) => {
  const raw = (await axiosClient.get(path(id))).data;
  const order = {
    ...mapOrder(raw),
    customerPhone: raw.customerPhone || raw.contract?.phone || '',
    customerCccd: raw.customerCccd || raw.contract?.idCard || '',
  };
  if (order.contract) {
    order.contract = {
      ...order.contract,
      contractPdfUrl: savedContractUrl(order.contract.contractPdfUrl, axiosClient.defaults.baseURL),
    };
  }
  return order;
};
export const cancelOrder = async (id) => mapOrder((await axiosClient.post(`${path(id)}/cancel`)).data);
export const getReturnInspection = async (id) => (await axiosClient.get(`${path(id)}/inspection`)).data;
export const approveReturnInspection = async (id, bankData) => (await axiosClient.post(`${path(id)}/inspection/approve`, bankData)).data;
export const disputeReturnInspection = async (id, data) => (await axiosClient.post(`${path(id)}/inspection/dispute`, data)).data;
