// src/app/plan-meet-greet/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import formStyles from './meetGreetForm.module.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Define the interface for your MeetGreetEvent (ensure it matches your backend)
interface MeetGreetEvent {
  id: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM
  location: string;
  description: string;
  createdAt: string; // ISO string
  createdBy: string;
}

export default function PlanMeetGreetPage() {
  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Calendar & Events List states
  const [events, setEvents] = useState<MeetGreetEvent[]>([]); // To store all fetched events
  const [calendarValue, onCalendarChange] = useState(new Date()); // For react-calendar's selected date
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<MeetGreetEvent[]>([]); // Events for the currently selected day

  const router = useRouter();

  // Function to fetch meet & greet events from the API
  const fetchMeetGreetEvents = async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const response = await fetch('/api/meet-greets');
      if (!response.ok) {
        throw new Error('Failed to fetch meet & greet events.');
      }
      const data: MeetGreetEvent[] = await response.json();
      // The backend API already sorts by date, but sorting here ensures consistency.
      const sortedEvents = data.sort((a, b) => {
        const dateTimeA = new Date(`${a.eventDate}T${a.eventTime}`).getTime();
        const dateTimeB = new Date(`${b.eventDate}T${b.eventTime}`).getTime();
        return dateTimeA - dateTimeB; // Ascending order
      });
      setEvents(sortedEvents);

      // After fetching, if a date is already selected, update its events
      if (calendarValue) {
        const currentSelectedDateEvents = sortedEvents.filter(event =>
          new Date(event.eventDate).toDateString() === new Date(calendarValue).toDateString()
        );
        setSelectedDateEvents(currentSelectedDateEvents);
      }
    } catch (err) {
      console.error('Error fetching meet & greet events:', err);
      setCalendarError('Could not load events. Please try again.');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Fetch events when the component mounts
  useEffect(() => {
    fetchMeetGreetEvents();
  }, []); // Empty dependency array means this runs once on mount

  // Helper function to check if a date has events
  const hasEventOnDate = (date: Date) => {
    return events.some(event =>
      new Date(event.eventDate).toDateString() === date.toDateString()
    );
  };

  // Handle click on a calendar tile (date)
  const handleCalendarDayClick = (date: Date) => {
    onCalendarChange(date); // Update calendar's selected date
    const dailyEvents = events.filter(event =>
      new Date(event.eventDate).toDateString() === date.toDateString()
    );
    setSelectedDateEvents(dailyEvents.sort((a, b) => a.eventTime.localeCompare(b.eventTime))); // Sort by time
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('You must be logged in to plan a meet & greet.');
        setFormLoading(false);
        router.push('/login');
        return;
      }

      const response = await fetch('/api/meet-greets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventName,
          eventDate,
          eventTime,
          location,
          description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormSuccess('Meet & Greet planned successfully!');
        console.log('Meet & Greet planned:', data.event);
        // After successful submission, refetch all events to update the calendar AND the full list
        fetchMeetGreetEvents();
        // Clear form fields
        setEventName('');
        setEventDate('');
        setEventTime('');
        setLocation('');
        setDescription('');
        // Optionally redirect after a short delay
        setTimeout(() => {
          // router.push('/dashboard'); // Consider where to redirect users
        }, 2000);
      } else {
        const errorData = await response.json();
        setFormError(`Error planning event: ${errorData.message || response.statusText}`);
        console.error('Error response:', errorData);
      }
    } catch (err) {
      console.error('Network error planning event:', err);
      setFormError('Network error. Could not plan event. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Layout>
      <div className={formStyles.pageContentWrapper}>
        {/* Left Side: Form for Planning Event */}
        <div className={formStyles.formSection}>
          <h1 className={formStyles.formTitle}>Plan a New Meet & Greet</h1>
          <form onSubmit={handleSubmit} className={formStyles.meetGreetForm}>
            {formError && <p className={formStyles.errorMessage}>{formError}</p>}
            {formSuccess && <p className={formStyles.successMessage}>{formSuccess}</p>}

            <div className={formStyles.formGroup}>
              <label htmlFor="eventName">Event Name:</label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="eventDate">Date:</label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="eventTime">Time:</label>
              <input
                type="time"
                id="eventTime"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="location">Location:</label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className={formStyles.textareaField}
                disabled={formLoading}
              ></textarea>
            </div>

            <button type="submit" disabled={formLoading} className={formStyles.submitButton}>
              {formLoading ? 'Planning...' : 'Plan Meet & Greet'}
            </button>
          </form>
        </div>

        {/* Right Side: Calendar and Event Lists */}
        <div className={formStyles.calendarSection}>
          <h1 className={formStyles.calendarTitle}>Planned Events</h1>
          {calendarLoading ? (
            <p className={formStyles.loadingMessage}>Loading events...</p>
          ) : calendarError ? (
            <p className={formStyles.errorMessage}>{calendarError}</p>
          ) : (
            <>
              <Calendar
                onChange={handleCalendarDayClick}
                value={calendarValue}
                className={formStyles.calendar}
                tileClassName={({ date, view }) => {
                  if (view === 'month' && hasEventOnDate(date)) {
                    return formStyles.hasEvent;
                  }
                  return null;
                }}
              />
              {/* Events for the currently selected date */}
              {selectedDateEvents.length > 0 && (
                <div className={formStyles.selectedDateEvents}>
                  <h3>Events on {calendarValue.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:</h3>
                  <ul>
                    {selectedDateEvents.map(event => (
                      <li key={event.id} className={formStyles.eventListItem}>
                        <div className={formStyles.eventTime}>{event.eventTime}</div>
                        <div className={formStyles.eventDetails}>
                          <strong className={formStyles.eventTitle}>{event.eventName}</strong>
                          <p className={formStyles.eventLocation}>at {event.location}</p>
                          {event.description && <p className={formStyles.eventDescription}>{event.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedDateEvents.length === 0 && events.length > 0 && ( // Show only if there are events in general
                  <p className={formStyles.noEventsMessage}>No events planned for {calendarValue.toLocaleDateString()}.</p>
              )}
              {events.length === 0 && (
                <p className={formStyles.noEventsMessage}>No events planned yet. Use the form to add one!</p>
              )}

              {/* ALL UPCOMING EVENTS LIST */}
              {events.length > 0 && (
                <div className={formStyles.allEventsList}>
                  <h2>All Upcoming Events</h2>
                  <ul>
                    {events.map(event => (
                      <li key={event.id} className={formStyles.eventListItem}>
                        <div className={formStyles.eventDateTime}>
                          {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          <br />
                          {event.eventTime}
                        </div>
                        <div className={formStyles.eventDetails}>
                          <strong className={formStyles.eventTitle}>{event.eventName}</strong>
                          <p className={formStyles.eventLocation}>at {event.location}</p>
                          {event.description && <p className={formStyles.eventDescription}>{event.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}