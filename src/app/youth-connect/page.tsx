// src/app/youth-connect/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import styles from './youthConnect.module.css';

// Define the interface for YouthConnectEntry (must match your backend's route.ts)
// This interface now includes fields for detailed individual youth profiles.
interface YouthConnectEntry {
  id: string;
  submitterId: string;
  name: string; // Name of youth, group, or activity
  ageRange: string; // e.g., '0-5', '6-10', '11-14', '15-18'
  interests: string; // comma-separated interests, e.g., 'sports, art, reading'
  contactEmail: string;
  type: 'individual' | 'group' | 'activity' | 'other';
  description: string;
  location?: string; // Optional: for groups/activities
  // --- NEW FIELDS FOR INDIVIDUAL YOUTH PROFILES ---
  grade?: string; // e.g., 'K', '1st', '5th', 'High School'
  hobbies?: string; // More detailed than interests, e.g., 'model building, stamp collecting'
  achievements?: string; // e.g., 'Science Fair Winner, Debate Team Captain'
  pictureUrl?: string; // URL to a profile picture
  awards?: string; // Specific awards received
  extraCurricularActivities?: string; // e.g., 'Scouts, Band, Chess Club'
  sports?: string; // e.g., 'Basketball (varsity), Swimming (club)'
  school?: string; // Name of the school
  // --- END NEW FIELDS ---
  createdAt: string; // ISO string
}

export default function YouthConnectPage() {
  const router = useRouter();

  // --- Form States (including new fields) ---
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [interests, setInterests] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [type, setType] = useState<YouthConnectEntry['type']>('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  // --- NEW STATES FOR INDIVIDUAL YOUTH ---
  const [grade, setGrade] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [achievements, setAchievements] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [awards, setAwards] = useState('');
  const [extraCurricularActivities, setExtraCurricularActivities] = useState('');
  const [sports, setSports] = useState('');
  const [school, setSchool] = useState('');
  // --- END NEW STATES ---
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // --- List States ---
  const [entries, setEntries] = useState<YouthConnectEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Function to fetch all youth connect entries
  const fetchYouthConnectEntries = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch('/api/youth-connect');
      if (!response.ok) {
        throw new Error('Failed to fetch youth connect entries.');
      }
      const data: YouthConnectEntry[] = await response.json();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching youth connect entries:', err);
      setListError('Could not load entries. Please try again.');
    } finally {
      setListLoading(false);
    }
  };

  // Fetch entries when the component mounts
  useEffect(() => {
    fetchYouthConnectEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('You must be logged in to submit a youth connect entry.');
        setFormLoading(false);
        router.push('/login');
        return;
      }

      const payload: Partial<YouthConnectEntry> = {
        name,
        ageRange,
        interests,
        contactEmail,
        type,
        description,
        location: type !== 'individual' ? location : undefined, // Location only for groups/activities
      };

      // Add individual youth-specific fields if type is 'individual'
      if (type === 'individual') {
        payload.grade = grade;
        payload.hobbies = hobbies;
        payload.achievements = achievements;
        payload.pictureUrl = pictureUrl;
        payload.awards = awards;
        payload.extraCurricularActivities = extraCurricularActivities;
        payload.sports = sports;
        payload.school = school;
      }

      const response = await fetch('/api/youth-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setFormSuccess('Youth Connect entry submitted successfully!');
        console.log('Youth Connect entry:', data.entry);
        fetchYouthConnectEntries(); // Refetch list to show new entry
        // Clear form fields
        setName('');
        setAgeRange('');
        setInterests('');
        setContactEmail('');
        setType('');
        setDescription('');
        setLocation('');
        setGrade('');
        setHobbies('');
        setAchievements('');
        setPictureUrl('');
        setAwards('');
        setExtraCurricularActivities('');
        setSports('');
        setSchool('');
      } else {
        const errorData = await response.json();
        setFormError(`Error submitting entry: ${errorData.message || response.statusText}`);
        console.error('Error response:', errorData);
      }
    } catch (err) {
      console.error('Network error submitting entry:', err);
      setFormError('Network error. Could not submit entry. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const formatAgeRange = (range: string) => {
    if (!range) return 'N/A';
    return range.replace(/-/g, ' to ');
  };

  const formatListString = (str?: string) => {
    if (!str) return 'N/A';
    return str.split(',').map(s => s.trim()).filter(Boolean).join(', ');
  };


  return (
    <Layout>
      <div className={styles.pageContentWrapper}>
        {/* Left Side: Submission Form */}
        <div className={styles.formSection}>
          <h1 className={styles.formTitle}>Share Youth Interests/Activities</h1>
          <p className={styles.formSubtitle}>Help connect youth in our community by sharing activities, groups, or interests.</p>
          <form onSubmit={handleSubmit} className={styles.youthConnectForm}>
            {formError && <p className={styles.errorMessage}>{formError}</p>}
            {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}

            <div className={styles.formGroup}>
              <label htmlFor="type">Type of Entry:</label>
              <select
                id="type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as YouthConnectEntry['type']);
                  // Reset individual-specific fields if type changes from 'individual'
                  if (e.target.value !== 'individual') {
                    setGrade('');
                    setHobbies('');
                    setAchievements('');
                    setPictureUrl('');
                    setAwards('');
                    setExtraCurricularActivities('');
                    setSports('');
                    setSchool('');
                  }
                }}
                required
                className={styles.selectField}
                disabled={formLoading}
              >
                <option value="">Select type</option>
                <option value="individual">Individual Youth (looking to connect)</option>
                <option value="group">Youth Group/Club</option>
                <option value="activity">Youth Activity/Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">Name ({type === 'individual' ? 'Youth Name' : 'Group/Activity Name'}):</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'individual' ? "E.g., 'Jane Doe'" : "E.g., 'Coding Club', 'Summer Basketball'"}
                required
                className={styles.inputField}
                disabled={formLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ageRange">Age Range:</label>
              <select
                id="ageRange"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                required
                className={styles.selectField}
                disabled={formLoading}
              >
                <option value="">Select age range</option>
                <option value="0-5">0-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="11-14">11-14 years</option>
                <option value="15-18">15-18 years</option>
                <option value="18+">18+ (Young Adult)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="interests">General Interests (comma-separated):</label>
              <input
                type="text"
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="E.g., 'soccer, video games, reading, volunteering'"
                className={styles.inputField}
                disabled={formLoading}
              />
            </div>

            {/* --- CONDITIONAL FIELDS FOR INDIVIDUAL YOUTH --- */}
            {type === 'individual' && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="grade">Grade/School Level:</label>
                  <input
                    type="text"
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="E.g., '5th Grade', 'Sophomore in High School'"
                    className={styles.inputField}
                    disabled={formLoading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="school">School Name:</label>
                  <input
                    type="text"
                    id="school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="E.g., 'Community High School'"
                    className={styles.inputField}
                    disabled={formLoading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="hobbies">Specific Hobbies (comma-separated):</label>
                  <input
                    type="text"
                    id="hobbies"
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    placeholder="E.g., 'model building, creative writing, robotics'"
                    className={styles.inputField}
                    disabled={formLoading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="sports">Sports Participated In (comma-separated):</label>
                  <input
                    type="text"
                    id="sports"
                    value={sports}
                    onChange={(e) => setSports(e.target.value)}
                    placeholder="E.g., 'Basketball (Varsity), Swimming (Club Team)'"
                    className={styles.inputField}
                    disabled={formLoading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="extraCurricularActivities">Extra-Curricular Activities (comma-separated):</label>
                  <input
                    type="text"
                    id="extraCurricularActivities"
                    value={extraCurricularActivities}
                    onChange={(e) => setExtraCurricularActivities(e.target.value)}
                    placeholder="E.g., 'Scouts, Band, Debate Club, Volunteering'"
                    className={styles.inputField}
                    disabled={formLoading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="achievements">Achievements:</label>
                  <textarea
                    id="achievements"
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    rows={3}
                    placeholder="E.g., 'Science Fair Winner 2024, Honor Roll, Eagle Scout'"
                    className={styles.textareaField}
                    disabled={formLoading}
                  ></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="awards">Awards Received:</label>
                  <textarea
                    id="awards"
                    value={awards}
                    onChange={(e) => setAwards(e.target.value)}
                    rows={3}
                    placeholder="E.g., 'President's Volunteer Service Award, Math Olympiad Bronze'"
                    className={styles.textareaField}
                    disabled={formLoading}
                  ></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pictureUrl">Picture URL (e.g., link to Google Drive/Cloud storage):</label>
                  <input
                    type="url" // Use type="url" for URL input
                    id="pictureUrl"
                    value={pictureUrl}
                    onChange={(e) => setPictureUrl(e.target.value)}
                    placeholder="https://example.com/your-youth-picture.jpg"
                    className={styles.inputField}
                    disabled={formLoading}
                  />
                </div>
              </>
            )}
            {/* --- END CONDITIONAL FIELDS --- */}


            <div className={styles.formGroup}>
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder={
                    type === 'individual'
                      ? "A brief bio for the youth, or what they're looking for in connections."
                      : "Tell us more about the group or activity. What are they looking for or offering?"
                }
                className={styles.textareaField}
                disabled={formLoading}
              ></textarea>
            </div>

            {type !== 'individual' && ( // Location only for groups/activities
              <div className={styles.formGroup}>
                <label htmlFor="location">Location (Optional, for groups/activities):</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g., 'Online', 'Community Park', 'School Gym'"
                  className={styles.inputField}
                  disabled={formLoading}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="contactEmail">Contact Email (for parents/guardians if individual):</label>
              <input
                type="email"
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
                required
                className={styles.inputField}
                disabled={formLoading}
              />
            </div>

            <button type="submit" disabled={formLoading} className={styles.submitButton}>
              {formLoading ? 'Submitting...' : 'Submit Youth Connect Entry'}
            </button>
          </form>
        </div>

        {/* Right Side: List of Youth Connect Entries */}
        <div className={styles.listSection}>
          <h1 className={styles.listTitle}>Youth Connect Board</h1>
          {listLoading ? (
            <p className={styles.loadingMessage}>Loading youth connect entries...</p>
          ) : listError ? (
            <p className={styles.errorMessage}>{listError}</p>
          ) : entries.length === 0 ? (
            <p className={styles.noEntriesMessage}>No youth connect entries available yet. Be the first to add one!</p>
          ) : (
            <ul className={styles.entriesList}>
              {entries.map((entry) => (
                <li key={entry.id} className={styles.entryCard}>
                  <div className={styles.entryHeader}>
                    {entry.pictureUrl && entry.type === 'individual' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.pictureUrl} alt={entry.name} className={styles.profilePicture} />
                    )}
                    <h2 className={styles.entryName}>{entry.name}</h2>
                    <span className={styles.ageRangeTag}>{formatAgeRange(entry.ageRange)}</span>
                  </div>
                  <p className={styles.entryType}>Type: **{entry.type.replace(/\b\w/g, char => char.toUpperCase())}**</p>
                  <p className={styles.entryDescription}>{entry.description}</p>
                  {entry.interests && (
                    <p className={styles.entryDetails}>**General Interests:** {formatListString(entry.interests)}</p>
                  )}
                  {entry.location && entry.type !== 'individual' && (
                    <p className={styles.entryDetails}>**Location:** {entry.location}</p>
                  )}

                  {/* --- DISPLAY NEW INDIVIDUAL YOUTH FIELDS --- */}
                  {entry.type === 'individual' && (
                    <>
                      {entry.school && <p className={styles.entryDetails}>**School:** {entry.school}</p>}
                      {entry.grade && <p className={styles.entryDetails}>**Grade:** {entry.grade}</p>}
                      {entry.hobbies && <p className={styles.entryDetails}>**Hobbies:** {formatListString(entry.hobbies)}</p>}
                      {entry.sports && <p className={styles.entryDetails}>**Sports:** {formatListString(entry.sports)}</p>}
                      {entry.extraCurricularActivities && <p className={styles.entryDetails}>**Activities:** {formatListString(entry.extraCurricularActivities)}</p>}
                      {entry.achievements && <p className={styles.entryDetails}>**Achievements:** {entry.achievements}</p>}
                      {entry.awards && <p className={styles.entryDetails}>**Awards:** {entry.awards}</p>}
                    </>
                  )}
                  {/* --- END DISPLAY NEW FIELDS --- */}

                  <div className={styles.contactInfo}>
                    **Contact:** <a href={`mailto:${entry.contactEmail}`} className={styles.contactLink}>{entry.contactEmail}</a>
                    <span className={styles.postDate}>Posted: {new Date(entry.createdAt).toLocaleDateString()}</span>
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