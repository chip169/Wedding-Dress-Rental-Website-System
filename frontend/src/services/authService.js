import axiosClient from '../api/axiosClient';

export const loginAccount = async (email, password) => (await axiosClient.post('/auth/login', { email, password })).data;
export const registerAccount = async (payload) => (await axiosClient.post('/auth/register', payload)).data;
