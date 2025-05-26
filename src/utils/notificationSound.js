// Create an audio element for notification sound
const notificationSound = new Audio('/sounds/notification.mp3');

// Initialize notification sound preference if not set
if (localStorage.getItem('notificationSoundEnabled') === null) {
  localStorage.setItem('notificationSoundEnabled', 'true');
}

// Function to play notification sound
export const playNotificationSound = () => {
  try {
    console.log('Playing notification sound...');
    // Reset the audio to the beginning
    notificationSound.currentTime = 0;
    // Set volume to maximum (100%)
    notificationSound.volume = 1.0;
    // Play the sound
    const playPromise = notificationSound.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Notification sound played successfully');
        })
        .catch(error => {
          console.error('Error playing notification sound:', error);
        });
    }
  } catch (error) {
    console.error('Error with notification sound:', error);
  }
};

// Function to enable/disable notification sound
export const setNotificationSoundEnabled = (enabled) => {
  try {
    console.log('Setting notification sound enabled:', enabled);
    localStorage.setItem('notificationSoundEnabled', enabled);
  } catch (error) {
    console.error('Error saving notification sound preference:', error);
  }
};

// Function to check if notification sound is enabled
export const isNotificationSoundEnabled = () => {
  try {
    const enabled = localStorage.getItem('notificationSoundEnabled') !== 'false';
    console.log('Notification sound enabled:', enabled);
    return enabled;
  } catch (error) {
    console.error('Error reading notification sound preference:', error);
    return true; // Default to enabled if there's an error
  }
}; 