import { updateVoucher, createNotification } from '../../services/api';

const PaymentMarking = () => {
  const handleMarkAsPaid = async (voucherId) => {
    try {
      await updateVoucher(voucherId, { status: 'paid' });
      
      // Create notifications for admin and staff
      await createNotification({
        title: 'Voucher Paid',
        message: 'Your voucher has been marked as paid by the accountant',
        type: 'voucher_paid',
        recipients: ['admin', 'staff']
      });

      // Refresh the vouchers list
      fetchVouchers();
    } catch (error) {
      setError(error.message);
    }
  };
}; 