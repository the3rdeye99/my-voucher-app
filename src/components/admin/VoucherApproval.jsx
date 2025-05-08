import { updateVoucher, createNotification } from '../../services/api';

const VoucherApproval = () => {
  const handleApprove = async (voucherId) => {
    try {
      await updateVoucher(voucherId, { status: 'approved' });
      
      // Create notifications for staff and accountant
      await createNotification({
        title: 'Voucher Approved',
        message: 'Your voucher has been approved by the admin',
        type: 'voucher_approved',
        recipients: ['staff', 'accountant']
      });

      // Refresh the vouchers list
      fetchVouchers();
    } catch (error) {
      setError(error.message);
    }
  };
}; 