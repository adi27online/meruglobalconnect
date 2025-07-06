// src/app/host-guest/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import formStyles from './hostGuestForm.module.css';

// Define the interface for GuestHostOffer (must match your backend's route.ts)
interface GuestHostOffer {
  id: string;
  hostId: string;
  accommodationType: 'spare_room' | 'couch' | 'entire_place' | 'other';
  availableFrom: string; // YYYY-MM-DD
  availableTo: string; // YYYY-MM-DD
  maxGuests: number;
  guestPurpose: 'student' | 'tourist' | 'new_resident' | 'temporary_stay' | 'family_visitor' | 'other' | '';
  hostDescription: string;
  specialConsiderations: string;
  contactEmail: string;
  // --- NEW ADDRESS FIELDS ---
  city: string;
  state: string;
  zip: string;
  country: string;
  // --- END NEW ADDRESS FIELDS ---
  status: 'active' | 'filled' | 'inactive';
  createdAt: string; // ISO string
}

export default function HostGuestPage() {
  const router = useRouter();

  // --- Form States ---
  const [accommodationType, setAccommodationType] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [maxGuests, setMaxGuests] = useState(1);
  const [guestPurpose, setGuestPurpose] = useState('');
  const [hostDescription, setHostDescription] = useState('');
  const [specialConsiderations, setSpecialConsiderations] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  // --- NEW ADDRESS STATES ---
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  // --- END NEW ADDRESS STATES ---
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // --- Offers List States ---
  const [offers, setOffers] = useState<GuestHostOffer[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Function to fetch all guest hosting offers from the API
  const fetchGuestHostingOffers = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch('/api/guest-hosts');
      if (!response.ok) {
        throw new Error('Failed to fetch guest hosting offers.');
      }
      const data: GuestHostOffer[] = await response.json();
      setOffers(data);
    } catch (err) {
      console.error('Error fetching guest hosting offers:', err);
      setListError('Could not load offers. Please try again.');
    } finally {
      setListLoading(false);
    }
  };

  // Fetch offers when the component mounts
  useEffect(() => {
    fetchGuestHostingOffers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('You must be logged in to host a guest.');
        setFormLoading(false);
        router.push('/login');
        return;
      }

      const response = await fetch('/api/guest-hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          accommodationType,
          availableFrom,
          availableTo,
          maxGuests: Number(maxGuests),
          guestPurpose,
          hostDescription,
          specialConsiderations,
          contactEmail,
          // --- NEW ADDRESS FIELDS IN PAYLOAD ---
          city,
          state,
          zip,
          country,
          // --- END NEW ADDRESS FIELDS IN PAYLOAD ---
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormSuccess('Guest hosting offer submitted successfully!');
        console.log('Guest hosting offer:', data.offer);
        fetchGuestHostingOffers(); // Refetch list
        // Clear form fields
        setAccommodationType('');
        setAvailableFrom('');
        setAvailableTo('');
        setMaxGuests(1);
        setGuestPurpose('');
        setHostDescription('');
        setSpecialConsiderations('');
        setContactEmail('');
        // --- CLEAR NEW ADDRESS FIELDS ---
        setCity('');
        setState('');
        setZip('');
        setCountry('');
        // --- END CLEAR NEW ADDRESS FIELDS ---
      } else {
        const errorData = await response.json();
        setFormError(`Error submitting offer: ${errorData.message || response.statusText}`);
        console.error('Error response:', errorData);
      }
    } catch (err) {
      console.error('Network error submitting offer:', err);
      setFormError('Network error. Could not submit offer. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper functions for formatting display
  const formatAccommodationType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatGuestPurpose = (purpose: string) => {
    if (!purpose) return 'Any purpose';
    return purpose.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <Layout>
      <div className={formStyles.pageContentWrapper}>
        {/* Left Side: Form for Hosting Offer */}
        <div className={formStyles.formSection}>
          <h1 className={formStyles.formTitle}>Offer Your Space</h1>
          <p className={formStyles.formSubtitle}>Provide details about your guest hosting availability.</p>
          <form onSubmit={handleSubmit} className={formStyles.hostGuestForm}>
            {formError && <p className={formStyles.errorMessage}>{formError}</p>}
            {formSuccess && <p className={formStyles.successMessage}>{formSuccess}</p>}

            <div className={formStyles.formGroup}>
              <label htmlFor="accommodationType">Type of Accommodation:</label>
              <select
                id="accommodationType"
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value)}
                required
                className={formStyles.selectField}
                disabled={formLoading}
              >
                <option value="">Select type</option>
                <option value="spare_room">Spare Room</option>
                <option value="couch">Couch</option>
                <option value="entire_place">Entire Place</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="availableFrom">Available From:</label>
              <input
                type="date"
                id="availableFrom"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="availableTo">Available To:</label>
              <input
                type="date"
                id="availableTo"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="maxGuests">Maximum Guests:</label>
              <input
                type="number"
                id="maxGuests"
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                min="1"
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            {/* --- NEW ADDRESS FIELDS --- */}
            <div className={formStyles.formGroup}>
              <label htmlFor="city">City:</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={formStyles.formRow}> {/* Group State and ZIP */}
              <div className={formStyles.formGroup}>
                <label htmlFor="state">State/Province:</label>
                <input
                  type="text"
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className={formStyles.inputField}
                  disabled={formLoading}
                />
              </div>
              <div className={formStyles.formGroup}>
                <label htmlFor="zip">ZIP/Postal Code:</label>
                <input
                  type="text"
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                  className={formStyles.inputField}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="country">Country:</label>
              <input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>
            {/* --- END NEW ADDRESS FIELDS --- */}

            <div className={formStyles.formGroup}>
              <label htmlFor="guestPurpose">Preferred Guest Purpose/Background:</label>
              <select
                id="guestPurpose"
                value={guestPurpose}
                onChange={(e) => setGuestPurpose(e.target.value)}
                className={formStyles.selectField}
                disabled={formLoading}
              >
                <option value="">Select purpose (optional)</option>
                <option value="student">Student</option>
                <option value="tourist">Tourist</option>
                <option value="new_resident">New Resident</option>
                <option value="temporary_stay">Temporary Stay</option>
                <option value="family_visitor">Family Visitor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="hostDescription">Describe what you offer:</label>
              <textarea
                id="hostDescription"
                value={hostDescription}
                onChange={(e) => setHostDescription(e.target.value)}
                rows={6}
                placeholder="E.g., 'Cozy spare room with private bath, access to kitchen. Close to university.' "
                className={formStyles.textareaField}
                disabled={formLoading}
              ></textarea>
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="specialConsiderations">Special Considerations (e.g., pets, allergies, accessibility):</label>
              <textarea
                id="specialConsiderations"
                value={specialConsiderations}
                onChange={(e) => setSpecialConsiderations(e.target.value)}
                rows={3}
                placeholder="E.g., 'Pet-friendly home (dogs only)', 'Nut-free kitchen', 'Wheelchair accessible.'"
                className={formStyles.textareaField}
                disabled={formLoading}
              ></textarea>
            </div>

            <div className={formStyles.formGroup}>
              <label htmlFor="contactEmail">Your Contact Email:</label>
              <input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
                className={formStyles.inputField}
                disabled={formLoading}
              />
            </div>

            <button type="submit" disabled={formLoading} className={formStyles.submitButton}>
              {formLoading ? 'Submitting Offer...' : 'Submit Hosting Offer'}
            </button>
          </form>
        </div>

        {/* Right Side: List of Guest Hosting Offers */}
        <div className={formStyles.offersListSection}>
          <h1 className={formStyles.listTitle}>Current Hosting Offers</h1>
          {listLoading ? (
            <p className={formStyles.loadingMessage}>Loading offers...</p>
          ) : listError ? (
            <p className={formStyles.errorMessage}>{listError}</p>
          ) : offers.length === 0 ? (
            <p className={formStyles.noOffersMessage}>No guest hosting offers available at the moment. Be the first to offer!</p>
          ) : (
            <ul className={formStyles.offersList}>
              {offers.map((offer) => (
                <li key={offer.id} className={formStyles.offerCard}>
                  <div className={formStyles.offerHeader}>
                    <h2 className={formStyles.accommodationType}>{formatAccommodationType(offer.accommodationType)}</h2>
                    <span className={formStyles.maxGuests}>Max Guests: {offer.maxGuests}</span>
                  </div>
                  <p className={formStyles.location}>
                    {offer.city}, {offer.state}, {offer.zip}, {offer.country} {/* Display location */}
                  </p>
                  <p className={formStyles.availability}>
                    **Available:** {new Date(offer.availableFrom).toLocaleDateString()} to {new Date(offer.availableTo).toLocaleDateString()}
                  </p>
                  {offer.hostDescription && (
                    <p className={formStyles.description}>{offer.hostDescription}</p>
                  )}
                  {offer.guestPurpose && (
                    <p className={formStyles.details}>**Preferred Guest:** {formatGuestPurpose(offer.guestPurpose)}</p>
                  )}
                  {offer.specialConsiderations && (
                    <p className={formStyles.details}>**Considerations:** {offer.specialConsiderations}</p>
                  )}
                  <div className={formStyles.contact}>
                    **Contact Host:** <a href={`mailto:${offer.contactEmail}`} className={formStyles.contactLink}>{offer.contactEmail}</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}