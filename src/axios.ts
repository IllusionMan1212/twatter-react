import axios from "axios";

const baseUrl = `${process.env.NEXT_PUBLIC_DOMAIN_URL}/`;
const axiosInstance = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_DOMAIN_URL}/`,
    timeout: 15000,
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        await axios.get(`${baseUrl}/users/validateToken`, {
            withCredentials: true,
        });
        return config;
    },
    (err) => {
        return Promise.reject(err);
    }
);

export default axiosInstance;
