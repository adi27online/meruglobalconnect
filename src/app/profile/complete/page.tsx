// src/app/profile/complete/page.tsx
'use client'; // This is a Client Component

import { useState, useEffect, useRef } from 'react'; // Import useRef for file input
import { useRouter } from 'next/navigation';
import styles from './profile.module.css'; // Import CSS Module
import Navbar from '@/components/Navbar'; // Import Navbar for consistent layout
import Link from 'next/link'; // For navigation back to dashboard

// Define interfaces for spouse and child to ensure type safety
interface Spouse {
  name: string;
}

interface Child {
  name: string;
  age: number | ''; // Use '' for empty input
  gender: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: '',
    city: '',
    state: '',
    country: '',
    email: '',
    bio: '',
    profession: '',
    hobbies: '', // Storing as comma-separated string for simplicity
    profilePicture: '', // URL for main profile picture
    spouse: { name: '' } as Spouse,
    children: [] as Child[],
    isMatrimonyEnabled: false,
    // Matrimony specific details
    dateOfBirth: '', // Stored as string for input type="date"
    timeOfBirth: '', // Stored as string for input type="time"
    placeOfBirth: '',
    fatherName: '',
    motherName: '',
    gender: '', // New field
    education: '', // New field
    matrimonyPictures: [] as string[], // Array of URLs for matrimony pictures
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for the main profile picture file
  const [filePreview, setFilePreview] = useState<string | null>(null); // State for local main profile picture preview URL

  const [matrimonyFiles, setMatrimonyFiles] = useState<File[]>([]); // New: State for matrimony picture files
  const [matrimonyPreviews, setMatrimonyPreviews] = useState<string[]>([]); // New: State for local matrimony picture preview URLs

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const matrimonyFileInputRef = useRef<HTMLInputElement>(null); // Ref for matrimony file input

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setProfile({
            name: userData.name || '',
            city: userData.city || '',
            state: userData.state || '',
            country: userData.country || '',
            email: userData.email || '',
            bio: userData.bio || '',
            profession: userData.profession || '',
            hobbies: userData.hobbies ? userData.hobbies.join(', ') : '',
            profilePicture: userData.profilePicture || '',
            spouse: userData.spouse || { name: '' },
            children: userData.children || [],
            isMatrimonyEnabled: userData.isMatrimonyEnabled || false,
            dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '', // Format ISO string to YYYY-MM-DD
            timeOfBirth: userData.timeOfBirth || '',
            placeOfBirth: userData.placeOfBirth || '',
            fatherName: userData.fatherName || '',
            motherName: userData.motherName || '',
            gender: userData.gender || '', // Populate new field
            education: userData.education || '', // Populate new field
            matrimonyPictures: userData.matrimonyPictures || [], // Populate existing matrimony pictures
          });
          setFilePreview(userData.profilePicture || null);
          setMatrimonyPreviews(userData.matrimonyPictures || []); // Set initial previews for matrimony pics
        } else {
          const errorData = await res.json();
          setMessage(`Failed to load profile: ${errorData.error || 'Unknown error'}`);
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setMessage('Network error or server unreachable.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  // Clean up object URLs when the component unmounts or previews change
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
      matrimonyPreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [filePreview, matrimonyPreviews]);


  // Handle changes for text/textarea inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  // Handle checkbox/toggle changes for isMatrimonyEnabled
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: checked,
      // Optional: Clear matrimony-specific fields if unchecked
      ...(checked ? {} : {
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        fatherName: '',
        motherName: '',
        gender: '',
        education: '',
        matrimonyPictures: [], // Clear pictures too
      }),
    }));
    // Clear matrimony files in state if unchecked
    if (!checked) {
      setMatrimonyFiles([]);
    }
  };


  // Handle spouse name change
  const handleSpouseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      spouse: { name: e.target.value },
    }));
  };

  // Handle child input changes
  const handleChildChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newChildren = [...profile.children];
    newChildren[index] = { ...newChildren[index], [name]: name === 'age' ? (value === '' ? '' : Number(value)) : value };
    setProfile((prevProfile) => ({
      ...prevProfile,
      children: newChildren,
    }));
  };

  // Add a new child
  const addChild = () => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      children: [...prevProfile.children, { name: '', age: '', gender: '' }],
    }));
  };

  // Remove a child
  const removeChild = (index: number) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      children: prevProfile.children.filter((_, i) => i !== index),
    }));
  };

  // Handle main profile picture file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file); // Store the file object
      setFilePreview(URL.createObjectURL(file)); // Create a local URL for instant preview
      setMessage(''); // Clear any messages when a new file is selected
    } else {
      setSelectedFile(null);
      setFilePreview(profile.profilePicture || null); // Revert to existing if file cleared
    }
  };

  // NEW: Handle matrimony picture file selection (multiple files)
  const handleMatrimonyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newMatrimonyFiles = [...matrimonyFiles, ...filesArray]; // Append new files
      setMatrimonyFiles(newMatrimonyFiles);

      const newPreviews = newMatrimonyFiles.map(file => URL.createObjectURL(file));
      setMatrimonyPreviews([...profile.matrimonyPictures, ...newPreviews]); // Combine existing and new previews
      setMessage('');
      if (matrimonyFileInputRef.current) {
        matrimonyFileInputRef.current.value = ''; // Clear file input value to allow selecting same file again
      }
    }
  };

  // NEW: Remove a matrimony picture (by URL or file index)
  const removeMatrimonyPicture = (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Remove from backend (profile.matrimonyPictures)
      const updatedExisting = profile.matrimonyPictures.filter((_, i) => i !== index);
      setProfile(prev => ({ ...prev, matrimonyPictures: updatedExisting }));
      setMatrimonyPreviews(updatedExisting.concat(matrimonyFiles.map(file => URL.createObjectURL(file))));
    } else {
      // Remove from newly selected files (matrimonyFiles)
      const updatedFiles = matrimonyFiles.filter((_, i) => i !== index);
      setMatrimonyFiles(updatedFiles);
      const newPreviews = updatedFiles.map(file => URL.createObjectURL(file));
      setMatrimonyPreviews(profile.matrimonyPictures.concat(newPreviews));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Not authenticated. Please log in again.');
      router.push('/login');
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl = profile.profilePicture; // Start with current or default main image URL

      // 1. Upload main profile picture if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profileImage', selectedFile);

        const uploadRes = await fetch('/api/upload-profile-pic', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.imageUrl;
          setMessage('Profile picture uploaded successfully.');
        } else {
          const uploadErrorData = await uploadRes.json();
          setMessage(`Profile picture upload failed: ${uploadErrorData.error || 'Unknown error'}`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Upload new matrimony pictures if any are selected
      let newMatrimonyImageUrls: string[] = [];
      if (matrimonyFiles.length > 0) {
        const matrimonyFormData = new FormData();
        matrimonyFiles.forEach((file) => {
          matrimonyFormData.append('matrimonyImages', file); // Use the same field name for all files
        });

        const matrimonyUploadRes = await fetch('/api/user/matrimony-pictures/upload', { // NEW API ENDPOINT
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' is NOT set here, browser sets it automatically with boundary
          },
          body: matrimonyFormData,
        });

        if (matrimonyUploadRes.ok) {
          const uploadData = await matrimonyUploadRes.json();
          newMatrimonyImageUrls = uploadData.imageUrls || [];
          setMessage(prev => prev + ' Matrimony pictures uploaded successfully.');
          setMatrimonyFiles([]); // Clear files from state after upload
        } else {
          const uploadErrorData = await matrimonyUploadRes.json();
          setMessage(prev => prev + ` Matrimony pictures upload failed: ${uploadErrorData.error || 'Unknown error'}`);
          // Don't return, allow profile update to continue if only picture upload failed
        }
      }

      // 3. Prepare other profile data for submission
      const dataToSubmit: any = { 
        ...profile, 
        profilePicture: imageUrl, 
        hobbies: profile.hobbies.split(',').map(h => h.trim()).filter(h => h), 
        children: profile.children.filter(child => child.name && child.age && child.gender),
        spouse: profile.spouse.name ? profile.spouse : undefined,
        matrimonyPictures: [...profile.matrimonyPictures, ...newMatrimonyImageUrls], // Combine existing and newly uploaded
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString() : '', // Convert for DB
      };

      // Clean up matrimony-specific fields if matrimony is disabled
      if (!profile.isMatrimonyEnabled) {
        delete dataToSubmit.dateOfBirth;
        delete dataToSubmit.timeOfBirth;
        delete dataToSubmit.placeOfBirth;
        delete dataToSubmit.fatherName;
        delete dataToSubmit.motherName;
        delete dataToSubmit.gender;
        delete dataToSubmit.education;
        delete dataToSubmit.matrimonyPictures; // Clear matrimony pictures from DB
      }


      // 4. Submit the main profile update
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (res.ok) {
        setMessage(prev => prev + ' Profile details updated successfully!');
        // Re-fetch profile to ensure UI is in sync with combined updates (pictures + data)
        setTimeout(() => router.push('/dashboard'), 2000); // Redirect after message
      } else {
        const errorData = await res.json();
        setMessage(prev => prev + ` Failed to update profile details: ${errorData.error || 'Unknown error'}`);
        if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
        }
      }
    } catch (err) {
      console.error('Profile update/upload network error:', err);
      setMessage('Network error or server unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading profile data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.profileBox}>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Location Fields */}
            <div className={styles.inputGroup}>
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={profile.city}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={profile.state}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={profile.country}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={isSubmitting || true} // Email is usually read-only after registration
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="bio">Bio (Tell us about yourself)</label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                className={`${styles.input} ${styles.textarea}`}
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="profession">Profession</label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={profile.profession}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="hobbies">Hobbies (comma-separated)</label>
              <input
                type="text"
                id="hobbies"
                name="hobbies"
                value={profile.hobbies}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            {/* Profile Picture Upload */}
            <div className={styles.inputGroup}>
              <label htmlFor="profilePicUpload">Upload Profile Picture (Main)</label>
              <input
                type="file"
                id="profilePicUpload"
                name="profilePicUpload"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
                disabled={isSubmitting}
              />
              {(filePreview || profile.profilePicture) && (
                <img
                  src={filePreview || profile.profilePicture}
                  alt="Profile Preview"
                  className={styles.profilePicPreview}
                />
              )}
            </div>

            {/* Spouse Name */}
            <div className={styles.inputGroup}>
              <label htmlFor="spouseName">Spouse Name</label>
              <input
                type="text"
                id="spouseName"
                name="spouseName"
                value={profile.spouse?.name || ''}
                onChange={handleSpouseChange}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            {/* Children Section */}
            <div className={styles.childrenSection}>
              <h2>Children</h2>
              {profile.children.map((child, index) => (
                <div key={index} className={styles.childInputGroup}>
                  <h3>Child #{index + 1}</h3>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={child.name}
                    onChange={(e) => handleChildChange(index, e)}
                    className={styles.input}
                    disabled={isSubmitting}
                    required
                  />
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={child.age}
                    onChange={(e) => handleChildChange(index, e)}
                    className={styles.input}
                    disabled={isSubmitting}
                    min="0"
                    required
                  />
                  <select
                    name="gender"
                    value={child.gender}
                    onChange={(e) => handleChildChange(index, e)}
                    className={styles.selectInput}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeChild(index)}
                    className={styles.removeButton}
                    disabled={isSubmitting}
                  >
                    Remove Child
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addChild}
                className={styles.addButton}
                disabled={isSubmitting}
              >
                Add Child
              </button>
            </div>

            {/* Matrimony Enable/Disable */}
            <div className={styles.inputGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        name="isMatrimonyEnabled"
                        checked={profile.isMatrimonyEnabled}
                        onChange={handleToggleChange}
                        className={styles.checkboxInput}
                        disabled={isSubmitting}
                    />
                    Enable Matrimony Section for my profile
                </label>
                <p className={styles.checkboxHelpText}>
                    By enabling this, your profile may be visible to others seeking matrimonial matches.
                </p>
            </div>

            {/* Matrimony Specific Details - Conditionally Rendered */}
            {profile.isMatrimonyEnabled && (
                <div className={styles.matrimonyDetailsSection}>
                    <h2>Matrimony Details</h2>
                    <div className={styles.inputGroup}>
                        <label htmlFor="gender">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            value={profile.gender}
                            onChange={handleChange}
                            className={styles.selectInput}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={profile.dateOfBirth}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled} 
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="timeOfBirth">Time of Birth</label>
                        <input
                            type="time"
                            id="timeOfBirth"
                            name="timeOfBirth"
                            value={profile.timeOfBirth}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled} 
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="placeOfBirth">Place of Birth</label>
                        <input
                            type="text"
                            id="placeOfBirth"
                            name="placeOfBirth"
                            value={profile.placeOfBirth}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="fatherName">Father's Name</label>
                        <input
                            type="text"
                            id="fatherName"
                            name="fatherName"
                            value={profile.fatherName}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="motherName">Mother's Name</label>
                        <input
                            type="text"
                            id="motherName"
                            name="motherName"
                            value={profile.motherName}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="education">Education</label>
                        <input
                            type="text"
                            id="education"
                            name="education"
                            value={profile.education}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled}
                        />
                    </div>
                    {/* Reusing profession input as general profession applies to matrimony too */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="profession">Profession</label>
                        <input
                            type="text"
                            id="profession"
                            name="profession"
                            value={profile.profession}
                            onChange={handleChange}
                            className={styles.input}
                            disabled={isSubmitting}
                            required={profile.isMatrimonyEnabled} // Make required if matrimony enabled
                        />
                    </div>

                    {/* Matrimony Pictures Upload */}
                    <div className={styles.inputGroup}>
                      <label htmlFor="matrimonyPicUpload">Upload Matrimony Pictures (Multiple)</label>
                      <input
                        type="file"
                        id="matrimonyPicUpload"
                        name="matrimonyImages" // Name matches FormData key in API
                        accept="image/*"
                        multiple // Allow multiple file selection
                        onChange={handleMatrimonyFileChange}
                        className={styles.fileInput}
                        disabled={isSubmitting}
                        ref={matrimonyFileInputRef} // Assign ref
                      />
                      <div className={styles.matrimonyPreviewsContainer}>
                        {matrimonyPreviews.map((src, index) => (
                          <div key={src + index} className={styles.matrimonyPreviewWrapper}>
                            <img
                              src={src}
                              alt={`Matrimony ${index + 1}`}
                              className={styles.matrimonyPicPreview}
                            />
                            <button
                              type="button"
                              onClick={() => removeMatrimonyPicture(index, index < profile.matrimonyPictures.length)}
                              className={styles.removeMatrimonyPicButton}
                              disabled={isSubmitting}
                            >
                              x
                            </button>
                          </div>
                        ))}
                        {matrimonyPreviews.length === 0 && (
                          <p className={styles.noMatrimonyPics}>No matrimony pictures uploaded yet.</p>
                        )}
                      </div>
                    </div> {/* End matrimony pictures input group */}

                </div> // End matrimonyDetailsSection
            )}


            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
            {message && <p className={styles.message}>{message}</p>}
          </form>

          <div className={styles.backLinkContainer}>
            <Link href="/dashboard" className={styles.backToDashboardLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}