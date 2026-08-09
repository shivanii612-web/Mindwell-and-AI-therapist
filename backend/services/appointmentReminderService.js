import Appointment from '../Models/Appointment.js';
import Notification from '../Models/Notification.js';

export const getAppointmentDateTime = (appointment) => {
    try {
        const datePart = new Date(appointment.preferredDate);
        const timePart = appointment.preferredTime;
        
        let hours = 0;
        let minutes = 0;
        
        if (timePart) {
            const ampmMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (ampmMatch) {
                hours = parseInt(ampmMatch[1]);
                minutes = parseInt(ampmMatch[2]);
                const ampm = ampmMatch[3].toUpperCase();
                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
            } else {
                const match = timePart.match(/(\d+):(\d+)/);
                if (match) {
                    hours = parseInt(match[1]);
                    minutes = parseInt(match[2]);
                }
            }
        }
        
        const fullDate = new Date(datePart);
        fullDate.setHours(hours, minutes, 0, 0);
        return fullDate;
    } catch (e) {
        return new Date(appointment.preferredDate);
    }
};

export const startAppointmentReminderService = (io) => {
    console.log('MindWell Reminder Service: Initialized loop (1 minute interval)');
    setInterval(async () => {
        try {
            const now = new Date();
            
            const appointments = await Appointment.find({
                status: 'Accepted',
                preferredDate: { $gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
            })
            .populate('userId', 'full_name')
            .populate('therapistId', 'full_name');

            for (const app of appointments) {
                const appTime = getAppointmentDateTime(app);
                const diffMs = appTime.getTime() - now.getTime();
                const diffMins = Math.round(diffMs / (60 * 1000));

                const reminderIntervals = [
                    { minutesBefore: 1440, label: '24 hours' },
                    { minutesBefore: 60, label: '1 hour' },
                    { minutesBefore: 15, label: '15 minutes' }
                ];

                for (const interval of reminderIntervals) {
                    if (diffMins <= interval.minutesBefore && diffMins > interval.minutesBefore - 30) {
                        const timeStr = app.preferredTime;
                        
                        // User Reminder
                        const userPatientId = app.userId?._id || app.userId || app.user_id;
                        if (userPatientId) {
                            const userNotifExists = await Notification.findOne({
                                userId: userPatientId,
                                type: 'appointment_reminder',
                                'data.appointmentId': app._id.toString(),
                                'data.minutesBefore': interval.minutesBefore
                            });

                            if (!userNotifExists) {
                                const therapistName = app.therapistId?.full_name || 'Dr. Sarah Wilson';
                                const notification = await Notification.create({
                                    userId: userPatientId,
                                    type: 'appointment_reminder',
                                    title: 'Upcoming Therapy Session',
                                    message: `Your appointment with ${therapistName} begins at ${timeStr} today. Please join a few minutes early.`,
                                    data: {
                                        appointmentId: app._id.toString(),
                                        minutesBefore: interval.minutesBefore,
                                        actionText: 'View Appointment',
                                        actionPath: `/appointments`
                                    }
                                });
                                if (io) {
                                    io.to(`user:${userPatientId.toString()}`).emit('new_notification', notification);
                                }
                            }
                        }

                        // Therapist Reminder
                        const therapistId = app.therapistId?._id || app.therapistId;
                        if (therapistId) {
                            const therapistNotifExists = await Notification.findOne({
                                userId: therapistId,
                                type: 'appointment_reminder',
                                'data.appointmentId': app._id.toString(),
                                'data.minutesBefore': interval.minutesBefore
                            });

                            if (!therapistNotifExists) {
                                const patientName = app.userId?.full_name || 'John D.';
                                const notification = await Notification.create({
                                    userId: therapistId,
                                    type: 'appointment_reminder',
                                    title: 'Upcoming Session',
                                    message: `You have a therapy session with ${patientName} today at ${timeStr}. Please be ready to start the session on time.`,
                                    data: {
                                        appointmentId: app._id.toString(),
                                        minutesBefore: interval.minutesBefore,
                                        actionText: 'View Appointment',
                                        actionPath: `/therapist?tab=appointments`
                                    }
                                });
                                if (io) {
                                    io.to(`user:${therapistId.toString()}`).emit('new_notification', notification);
                                }
                            }
                        }
                    }
                }

                // 5. Session Ending Reminder
                if (app.sessionStatus === 'live' && app.sessionStartedAt) {
                    const sessionStart = new Date(app.sessionStartedAt);
                    const durationMins = 60; 
                    const sessionEnd = new Date(sessionStart.getTime() + durationMins * 60 * 1000);
                    const diffEndMs = sessionEnd.getTime() - now.getTime();
                    const diffEndMins = Math.round(diffEndMs / (60 * 1000));

                    if (diffEndMins <= 5 && diffEndMins > 0) {
                        const therapistId = app.therapistId?._id || app.therapistId;
                        if (therapistId) {
                            const endingNotifExists = await Notification.findOne({
                                userId: therapistId,
                                type: 'session_ending_soon',
                                'data.appointmentId': app._id.toString()
                            });

                            if (!endingNotifExists) {
                                const notification = await Notification.create({
                                    userId: therapistId,
                                    type: 'session_ending_soon',
                                    title: 'Session Ending Soon',
                                    message: `This session will end in approximately 5 minutes.`,
                                    data: {
                                        appointmentId: app._id.toString()
                                    }
                                });
                                if (io) {
                                    io.to(`user:${therapistId.toString()}`).emit('new_notification', notification);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('MindWell: appointmentReminderService error:', err);
        }
    }, 60000); 
};
