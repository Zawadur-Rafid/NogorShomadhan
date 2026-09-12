export const SMS_API_KEY = process.env.EXPO_PUBLIC_BULKSMSBD_API_KEY || "";
export const SMS_SENDER_ID = process.env.EXPO_PUBLIC_BULKSMSBD_SENDER_ID || "";

export const smsService = {
  async sendSMS(number: string, message: string) {
    try {
      const url = `http://bulksmsbd.net/api/smsapi?api_key=${SMS_API_KEY}&type=text&number=${number}&senderid=${SMS_SENDER_ID}&message=${encodeURIComponent(
        message,
      )}`;

      const response = await fetch(url);
      
      // The API returns a JSON response usually, or might be text, but let's try to parse it
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
      
      console.log("SMS Service Response:", data);
      return data;
    } catch (error) {
      console.error("SMS Sending Error:", error);
      throw error;
    }
  },

  async sendApprovalSMS(number: string) {
    const message = "Your NogorShomadhan account has been accepted. You can now log in.";
    return this.sendSMS(number, message);
  },

  async sendRejectionSMS(number: string) {
    const message = "Your NogorShomadhan account registration has been rejected. Please contact the administrator.";
    return this.sendSMS(number, message);
  }
};
