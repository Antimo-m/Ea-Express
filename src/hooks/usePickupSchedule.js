import { useEffect } from 'react';
import { request } from '../api/client';
import { attachBookingRules } from '../services/booking-rules';

export function usePickupSchedule(formRef, original) {
    useEffect(() => attachBookingRules(
        formRef.current,
        {server_now:new Date().toISOString()},
        original,
        () => request('/booking-rules'),
    ), [formRef, original]);
}
