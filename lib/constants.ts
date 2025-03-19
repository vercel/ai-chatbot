export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isTestEnvironment = Boolean(process.env.PLAYWRIGHT);
