# Requirements Document

## Introduction

This specification defines the requirements for implementing a multi-task video download queue manager for the Eagle Video Downloader plugin. The current implementation only supports single downloads - users must wait for one download to complete before starting another. This feature will enable users to queue multiple video downloads, monitor their progress simultaneously, and manage the download queue efficiently.

The implementation must match the Figma design specifications while maintaining backward compatibility with the existing download functionality and Eagle plugin API integration.

## Glossary

- **Queue_Manager**: The system component responsible for managing multiple concurrent download tasks
- **Download_Item**: A single video download task in the queue with associated metadata and state
- **Queue_UI**: The user interface component that displays the list of download items
- **Input_Bar**: The UI component at the bottom of the window for entering new video URLs
- **Progress_Bar**: The visual indicator showing download progress for each item
- **Download_State**: The current status of a download item (preparing, downloading, completed, error)
- **Eagle_Plugin**: The host application environment providing the plugin API
- **yt-dlp**: The external binary tool used for downloading videos

## Requirements

### Requirement 1: Queue State Management

**User Story:** As a user, I want to add multiple videos to a download queue, so that I can download several videos without waiting for each one to complete.

#### Acceptance Criteria

1. WHEN a user submits a new video URL, THE Queue_Manager SHALL add it to the queue without blocking existing downloads
2. WHEN multiple downloads are in progress, THE Queue_Manager SHALL track the state of each Download_Item independently
3. WHEN a Download_Item completes, THE Queue_Manager SHALL update its state to completed and maintain it in the queue history
4. WHEN a Download_Item encounters an error, THE Queue_Manager SHALL update its state to error and preserve the error information
5. THE Queue_Manager SHALL support at least 10 concurrent Download_Items in the queue

### Requirement 2: Download Item Data Model

**User Story:** As a user, I want to see detailed information about each download, so that I can identify and track my videos.

#### Acceptance Criteria

1. WHEN a Download_Item is created, THE Queue_Manager SHALL store the video title, source URL, format, resolution, and file size
2. WHEN video metadata is fetched, THE Queue_Manager SHALL update the Download_Item with the retrieved information
3. WHEN a Download_Item is in progress, THE Queue_Manager SHALL track the current download percentage, speed, and estimated time remaining
4. THE Queue_Manager SHALL assign each Download_Item a unique identifier for tracking purposes
5. WHEN a Download_Item state changes, THE Queue_Manager SHALL update the timestamp of the last state change

### Requirement 3: Queue UI Display

**User Story:** As a user, I want to see all my downloads in a list, so that I can monitor their progress at a glance.

#### Acceptance Criteria

1. WHEN the Queue_UI is rendered, THE System SHALL display all Download_Items in a scrollable list
2. WHEN the queue contains more items than fit in the viewport, THE Queue_UI SHALL provide vertical scrolling
3. WHEN a Download_Item is added to the queue, THE Queue_UI SHALL display it immediately at the top of the list
4. WHEN a Download_Item state changes, THE Queue_UI SHALL update the visual representation within 500ms
5. THE Queue_UI SHALL display a maximum height of 600px and enable scrolling for overflow content

### Requirement 4: Download Item Visual Representation

**User Story:** As a user, I want each download to show its status clearly, so that I can understand what is happening with each video.

#### Acceptance Criteria

1. WHEN a Download_Item is displayed, THE Queue_UI SHALL show the video title in 14px white text with ellipsis for overflow
2. WHEN a Download_Item is displayed, THE Queue_UI SHALL show metadata (source, format, resolution, size) in 12px text at 40% opacity
3. WHEN a Download_Item is downloading, THE Queue_UI SHALL display a progress bar with gradient colors (#3297ff to #4caf50)
4. WHEN a Download_Item is downloading, THE Queue_UI SHALL show the current percentage as text centered on the progress bar
5. WHEN a Download_Item is preparing, THE Queue_UI SHALL display "Preparing..." status text
6. WHEN a Download_Item encounters an error, THE Queue_UI SHALL display the error message in red text
7. WHEN a Download_Item completes, THE Queue_UI SHALL display "Complete" status and maintain the full progress bar

### Requirement 5: Input Bar Functionality

**User Story:** As a user, I want to add new downloads while others are in progress, so that I can build my download queue efficiently.

#### Acceptance Criteria

1. WHEN the Input_Bar is displayed, THE System SHALL show a text input field and a download button
2. WHEN a user types in the Input_Bar, THE System SHALL validate the URL format in real-time
3. WHEN a user submits a valid URL, THE System SHALL add it to the queue and clear the input field
4. WHEN a user submits an invalid URL, THE System SHALL display an error message without clearing the input
5. WHEN downloads are in progress, THE Input_Bar SHALL remain enabled and accept new URLs
6. WHEN the input field receives focus, THE System SHALL clear any previous error states

### Requirement 6: Window Layout and Dimensions

**User Story:** As a user, I want the plugin window to accommodate the queue display, so that I can see multiple downloads simultaneously.

#### Acceptance Criteria

1. THE System SHALL set the plugin window width to 400px
2. THE System SHALL set the plugin window initial height to 600px
3. THE System SHALL maintain the header height at 48px with logo, title, and close button
4. THE System SHALL allocate the remaining vertical space to the scrollable queue area and fixed input bar
5. THE System SHALL apply the Inter font family to all text elements

### Requirement 7: Design System Consistency

**User Story:** As a user, I want the interface to follow a consistent design language, so that the plugin feels polished and professional.

#### Acceptance Criteria

1. THE System SHALL use #191a1d as the main background color (--bg1)
2. THE System SHALL use #131416 as the secondary background color for items and input (--bg2)
3. THE System SHALL use white as the primary text color (--fg1)
4. THE System SHALL use rgba(255,255,255,0.4) as the secondary text color (--fg2)
5. THE System SHALL use #3197ff as the brand color for buttons and accents (--brand)
6. THE System SHALL use rgba(255,255,255,0.04) as the stroke color for borders (--stroke)
7. WHEN a Download_Item is displayed, THE System SHALL apply 10px border-radius and 2px padding
8. WHEN the Input_Bar is displayed, THE System SHALL apply 8px border-radius to the input field

### Requirement 8: Concurrent Download Processing

**User Story:** As a developer, I want downloads to process concurrently, so that users can download multiple videos simultaneously.

#### Acceptance Criteria

1. WHEN multiple Download_Items are in the queue, THE Queue_Manager SHALL process them concurrently up to a maximum of 3 simultaneous downloads
2. WHEN a download slot becomes available, THE Queue_Manager SHALL automatically start the next queued Download_Item
3. WHEN all download slots are occupied, THE Queue_Manager SHALL queue additional items in a "waiting" state
4. WHEN a Download_Item is processing, THE Queue_Manager SHALL emit progress updates at least every 500ms
5. THE Queue_Manager SHALL maintain the existing yt-dlp download functionality without modification

### Requirement 9: Error Handling and Recovery

**User Story:** As a user, I want to understand when downloads fail and have options to retry, so that I can successfully download my videos.

#### Acceptance Criteria

1. WHEN a Download_Item fails due to network error, THE System SHALL display a descriptive error message
2. WHEN a Download_Item fails due to invalid URL, THE System SHALL display "Invalid video URL" message
3. WHEN a Download_Item fails, THE System SHALL provide a retry button for that specific item
4. WHEN a user clicks retry, THE System SHALL reset the Download_Item state and restart the download
5. WHEN a Download_Item fails, THE System SHALL not block other downloads from processing

### Requirement 10: Eagle Integration Compatibility

**User Story:** As a user, I want downloaded videos to import into Eagle automatically, so that my workflow remains unchanged.

#### Acceptance Criteria

1. WHEN a Download_Item completes successfully, THE System SHALL import the video to Eagle with metadata
2. WHEN importing to Eagle, THE System SHALL include the video title, source URL, tags, and description
3. WHEN a duplicate video is detected, THE System SHALL display a warning but allow re-download if requested
4. WHEN Eagle import fails, THE System SHALL display an error but keep the downloaded file information
5. THE System SHALL maintain the existing duplicate checking functionality using Eagle's API

### Requirement 11: Internationalization Support

**User Story:** As a user, I want the interface in my preferred language, so that I can understand all status messages.

#### Acceptance Criteria

1. THE System SHALL detect the user's language from Eagle's locale settings
2. THE System SHALL support English and Simplified Chinese languages
3. WHEN displaying status messages, THE System SHALL use the appropriate translation for the current language
4. WHEN adding new UI text, THE System SHALL provide translations in both supported languages
5. THE System SHALL apply translations to all queue status messages (preparing, downloading, complete, error)

### Requirement 12: State Persistence (Optional)

**User Story:** As a user, I want my download history to persist across plugin sessions, so that I can reference previously downloaded videos.

#### Acceptance Criteria

1. WHERE persistence is enabled, WHEN the plugin closes, THE System SHALL save the queue state to local storage
2. WHERE persistence is enabled, WHEN the plugin opens, THE System SHALL restore completed downloads from local storage
3. WHERE persistence is enabled, THE System SHALL limit stored history to the most recent 50 Download_Items
4. WHERE persistence is enabled, WHEN restoring state, THE System SHALL not restart incomplete downloads automatically
5. WHERE persistence is disabled, THE System SHALL clear all queue state when the plugin closes
