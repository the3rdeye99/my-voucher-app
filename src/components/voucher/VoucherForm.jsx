import { createVoucher, createNotification } from '../../services/api';

const VoucherForm = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newVoucher = await createVoucher(formData);
      
      // Create notifications for admin and accountant
      await createNotification({
        title: 'New Voucher Created',
        message: `A new voucher has been created by ${user.name}`,
        type: 'voucher_created',
        recipients: ['admin', 'accountant']
      });

      // Reset form and show success message
      setFormData({
        amount: '',
        description: '',
        category: ''
      });
      setSuccess('Voucher created successfully!');
    } catch (error) {
      setError(error.message);
    }
  };
}; 