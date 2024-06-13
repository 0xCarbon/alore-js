export const validateEmailPattern = (email: string) => {
  const emailPattern = /\S+@\S+\.\S+/;

  return emailPattern.test(email);
};
