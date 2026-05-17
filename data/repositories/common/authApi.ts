export const authApi = {
    changePassword: async (data: { newPassword: string }) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('changePassword mock success');
        return Promise.resolve();
    },
    verifyOtp: async (email: string, otp: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('verifyOtp mock success');
        return Promise.resolve();
    },
    sendOtp: async (email: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('sendOtp mock success for', email);
        return Promise.resolve();
    },
    register: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('register mock success', data);
        return Promise.resolve();
    }
};
