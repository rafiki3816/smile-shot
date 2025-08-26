// Announcement emitter singleton
class AnnouncementEmitter extends EventTarget {
  announce(message, priority = 'polite') {
    this.dispatchEvent(new CustomEvent('announce', { 
      detail: { message, priority } 
    }));
  }
}

export const announcer = new AnnouncementEmitter();

// Helper functions for common announcements
export const announceScore = (score) => {
  announcer.announce(`Score: ${score} points`, 'polite');
};

export const announceCoaching = (message) => {
  announcer.announce(message, 'polite');
};

export const announceError = (error) => {
  announcer.announce(`Error: ${error}`, 'assertive');
};

export const announceSuccess = (message) => {
  announcer.announce(`Success: ${message}`, 'polite');
};

export const announcePageChange = (pageName) => {
  announcer.announce(`Now on ${pageName} page`, 'polite');
};