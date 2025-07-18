# VideoTube Backend 🎥

A robust and scalable backend for a video-sharing platform, built with Node.js, Express.js, and MongoDB. This project mimics core functionalities of popular video platforms, allowing users to register, upload videos, manage content, interact with other users through comments and likes, and organize videos into playlists.

---

## ✨ Features

* **User Management:**
    * User registration with avatar and cover image uploads.
    * Secure user login and logout with JWT-based authentication.
    * Password change functionality.
    * Update account details, avatar, and cover image.
    * View user channel profiles, including subscriber counts and subscription status.
    * Access watch history and user-specific video uploads.
    * Dashboard for channel owners to view analytics (total views, subscribers, likes, videos).

* **Video Management:**
    * Upload and publish videos with title, description, video file, and thumbnail.
    * Retrieve all videos with pagination, search, and sorting capabilities.
    * Get detailed information for a single video, including likes and comments.
    * Update video details and toggle publishing status.
    * Delete videos (removes from cloud storage too).
    * Get recommended videos based on keywords.

* **Interactions:**
    * **Comments:** Add, update, and delete comments on videos.
    * **Likes:** Toggle likes on videos, comments, and tweets.
    * **Subscriptions:** Subscribe to and unsubscribe from user channels.
    * **Tweets:** Create, update, and delete short text posts.

* **Playlist Management:**
    * Create, update, and delete custom video playlists.
    * Add and remove videos from playlists.
    * View user-specific playlists and individual playlist details.

---

## 🚀 Technologies Used

* **Backend:**
    * [Node.js](https://nodejs.org/): JavaScript runtime environment
    * [Express.js](https://expressjs.com/): Web application framework for Node.js
    * [MongoDB](https://www.mongodb.com/): NoSQL database
    * [Mongoose](https://mongoosejs.com/): MongoDB object data modeling (ODM) for Node.js
    * [bcrypt](https://www.npmjs.com/package/bcrypt): For hashing passwords
    * [jsonwebtoken (JWT)](https://www.npmjs.com/package/jsonwebtoken): For secure authentication
    * [multer](https://www.npmjs.com/package/multer): Middleware for handling `multipart/form-data` (file uploads)
    * [Cloudinary](https://cloudinary.com/): Cloud-based media management for storing videos and images
    * [cookie-parser](https://www.npmjs.com/package/cookie-parser): Middleware to parse cookies
    * [cors](https://www.npmjs.com/package/cors): Middleware for enabling Cross-Origin Resource Sharing
    * [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a `.env` file

* **Utilities:**
    * `ApiError.js`: Custom error handling utility.
    * `ApiResponse.js`: Standardized API response utility.
    * `asyncHandler.js`: Utility to simplify asynchronous error handling in Express routes.

---

## ⚙️ Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

* Node.js (v18 or higher recommended)
* MongoDB (local installation or cloud service like MongoDB Atlas)
* Cloudinary Account (for media storage)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/videotube-backend.git](https://github.com/your-username/videotube-backend.git)
    cd videotube-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/videotube # Or your MongoDB Atlas URI
CORS_ORIGIN=* # Or specify your frontend URL, e.g., http://localhost:5173
ACCESS_TOKEN_SECRET=your_access_token_secret_key
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Note:** Replace placeholder values (`your_...`) with your actual keys and configurations. For `CORS_ORIGIN`, it's recommended to specify your frontend's URL in a production environment for security.

### Running the Backend

1.  **Start the MongoDB server** (if running locally).
2.  **Run the application:**
    ```bash
    npm run dev # Or 'node src/index.js'
    ```
    The server will start on the port specified in your `.env` file (default: `8000`).

### Running the Frontend (Optional)

This backend is designed to work with a separate frontend application. If you have the React frontend (as generated in the previous turn), ensure it's running and configured to communicate with this backend's API.

---

## 📊 API Endpoints

The API is structured under the `/api/v1` prefix.

### User Routes (`/api/v1/users`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `POST` | `/register` | Register a new user | `multer` |
| `POST` | `/login` | Log in a user | |
| `POST` | `/logout` | Log out the current user | `verifyJWT` |
| `POST` | `/refresh-token` | Refresh access token using refresh token | |
| `POST` | `/change-password` | Change current user's password | `verifyJWT` |
| `GET` | `/current-user` | Get details of the currently logged-in user | `verifyJWT` |
| `PATCH` | `/update-account` | Update user's full name and email | `verifyJWT` |
| `PATCH` | `/avatar` | Update user's avatar | `verifyJWT`, `multer` |
| `PATCH` | `/cover-image` | Update user's cover image | `verifyJWT`, `multer` |
| `GET` | `/c/:userName` | Get channel profile by username | `verifyJWT` |
| `GET` | `/history` | Get current user's watch history | `verifyJWT` |
| `GET` | `/c/:userName/videos` | Get all videos uploaded by a specific user | `verifyJWT` |
| `GET` | `/c/:userName/dashboard` | Get dashboard analytics for a channel owner | `verifyJWT` |

### Video Routes (`/api/v1/videos`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `GET` | `/` | Get all videos (supports query, sort, pagination) | |
| `GET` | `/recommendation/:videoId` | Get recommended videos based on a video | |
| `POST` | `/upload-video` | Publish a new video | `verifyJWT`, `multer` |
| `GET` | `/:videoId` | Get video details by ID | `verifyJWT` |
| `PATCH` | `/update/:videoId` | Update video details (title, description, thumbnail) | `verifyJWT`, `multer` |
| `DELETE` | `/delete/:videoId` | Delete a video | `verifyJWT` |
| `PATCH` | `/toggle/:videoId` | Toggle video publish status | `verifyJWT` |

### Comment Routes (`/api/v1/comments`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `GET` | `/:videoId` | Get all comments for a video | `verifyJWT` |
| `POST` | `/:videoId` | Add a comment to a video | `verifyJWT` |
| `PATCH` | `/c/:commentId` | Update a comment | `verifyJWT` |
| `DELETE` | `/c/:commentId` | Delete a comment | `verifyJWT` |

### Like Routes (`/api/v1/likes`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `POST` | `/toggle/v/:videoId` | Toggle like on a video | `verifyJWT` |
| `POST` | `/toggle/c/:commentId` | Toggle like on a comment | `verifyJWT` |
| `POST` | `/toggle/t/:tweetId` | Toggle like on a tweet | `verifyJWT` |
| `GET` | `/videos` | Get all videos liked by the current user | `verifyJWT` |

### Subscription Routes (`/api/v1/subscriptions`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `GET` | `/c/subscribed-to/:userName` | Get channels a user is subscribed to | |
| `GET` | `/c/subscribers/:channelId` | Get subscribers of a channel | `verifyJWT` |
| `POST` | `/c/:channelId` | Toggle subscription to a channel | `verifyJWT` |

### Playlist Routes (`/api/v1/playlists`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `GET` | `/user/:userName` | Get all playlists created by a user | |
| `POST` | `/` | Create a new playlist | `verifyJWT` |
| `GET` | `/:playlistId` | Get playlist details by ID | `verifyJWT` |
| `PATCH` | `/:playlistId` | Update playlist name/description | `verifyJWT` |
| `DELETE` | `/:playlistId` | Delete a playlist | `verifyJWT` |
| `PATCH` | `/add/:videoId/:playlistId` | Add a video to a playlist | `verifyJWT` |
| `PATCH` | `/remove/:videoId/:playlistId` | Remove a video from a playlist | `verifyJWT` |

### Tweet Routes (`/api/v1/tweets`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `GET` | `/c/:userName` | Get all tweets by a specific user | |
| `POST` | `/` | Create a new tweet | `verifyJWT` |
| `PATCH` | `/:tweetId` | Update a tweet's content | `verifyJWT` |
| `DELETE` | `/:tweetId` | Delete a tweet | `verifyJWT` |

### Health Check Route (`/api/v1/healthcheck`)

| Method | Endpoint | Description | Middleware |
| :----- | :------- | :---------- | :--------- |
| `GET` | `/` | Check if the server is running | |

---

## 📦 Database Schema

This project uses MongoDB with Mongoose for schema definition.

### `User` Model (`src/models/user.model.js`)

```javascript
// Simplified Schema
const userSchema = new Schema({
    userName: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true, index: true },
    avatar: { type: String, required: true }, // Cloudinary URL
    coverImage: { type: String }, // Cloudinary URL
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    password: { type: String, required: true },
    refreshToken: { type: String }
}, { timestamps: true });
```

### `Video` Model (`src/models/video.model.js`)

```javascript
// Simplified Schema
const videoSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    videoFile: { url: String, publicId: String, required: true }, // Cloudinary URL & ID
    thumbnail: { url: String, publicId: String, required: true }, // Cloudinary URL & ID
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, required: true }
}, { timestamps: true });
```

### `Comment` Model (`src/models/comment.model.js`)

```javascript
// Simplified Schema
const commentSchema = new Schema({
    content: { type: String, required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    owner: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
```

### `Like` Model (`src/models/like.model.js`)

```javascript
// Simplified Schema
const likeSchema = new Schema({
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" },
    likedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
```

### `Subscription` Model (`src/models/subscription.model.js`)

```javascript
// Simplified Schema
const subscriptionSchema = new Schema({
    subscriber: { type: Schema.Types.ObjectId, ref: "User" },
    channel: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
```

### `Tweet` Model (`src/models/tweet.model.js`)

```javascript
// Simplified Schema
const tweetSchema = new Schema({
    content: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
```

### `Playlist` Model (`src/models/playlist.model.js`)

```javascript
// Simplified Schema
const playlistSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    videos: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    owner: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
```

---

## 📂 Project Structure

```
.
├── public/
│   └── temp/           # Temporary storage for uploaded files by Multer
├── src/
│   ├── app.js          # Express application setup and middleware
│   ├── constants.js    # Global constants (e.g., DB_NAME)
│   ├── controllers/    # Business logic for handling requests
│   │   ├── comment.controller.js
│   │   ├── healthCheck.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   ├── tweet.controller.js
│   │   ├── user.controller.js
│   │   └── video.controller.js
│   ├── db/             # Database connection setup
│   │   └── index.js
│   ├── middlewares/    # Custom Express middleware (e.g., authentication, file upload)
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   ├── models/         # Mongoose schemas and models
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── playlist.model.js
│   │   ├── subscription.model.js
│   │   ├── tweet.model.js
│   │   ├── user.model.js
│   │   └── video.model.js
│   ├── routes/         # API route definitions
│   │   ├── comment.routes.js
│   │   ├── healthCheck.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   ├── tweet.routes.js
│   │   ├── user.routes.js
│   │   └── video.routes.js
│   ├── utils/          # Utility functions and custom classes
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cloudinary.js
│   └── index.js        # Application entry point
├── .env                # Environment variables (create this file)
├── .gitignore          # Specifies intentionally untracked files to ignore
├── package.json        # Project metadata and dependencies
└── README.md           # This documentation file
```

---

## 🚀 Key Learnings & Challenges

This project was a significant learning experience, especially for a beginner in backend development. Here are some key takeaways:

* **Asynchronous Programming:** Mastering `async/await` and handling promises correctly is crucial for Node.js. The `asyncHandler` utility was a lifesaver for managing errors in asynchronous routes without repetitive `try-catch` blocks.

* **Authentication & Authorization:** Implementing JWTs for stateless authentication, managing access and refresh tokens, and securing routes with middleware (`verifyJWT`) taught me the fundamentals of secure API access.

* **File Management with Cloudinary:** Integrating `multer` for local file handling and then seamlessly uploading to a cloud service like Cloudinary was a practical lesson in managing media assets efficiently and securely.

* **Database Design & Complex Queries:** Designing MongoDB schemas and utilizing Mongoose's powerful aggregation pipeline for complex data retrieval (e.g., fetching user profiles with subscriber counts, or video details with likes and comments) was challenging but incredibly rewarding. It highlighted the importance of optimizing database queries.

* **API Design Principles:** Understanding how to structure RESTful APIs, standardize responses (`ApiResponse`), and handle errors gracefully (`ApiError`) are vital for building maintainable and user-friendly backends.

* **Environment Variables:** The critical importance of using `.env` files to manage sensitive information and configurations, ensuring security and flexibility across different deployment environments.

This project reinforced the importance of **clean code**, **modular design**, **security best practices**, and **efficient data handling** in building robust web applications.

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to add new features, please follow these steps:

1.  Fork the repository.

2.  Create a new branch (`git checkout -b feature/your-feature-name`).

3.  Make your changes.

4.  Commit your changes (`git commit -m 'Add new feature'`).

5.  Push to the branch (`git push origin feature/your-feature-name`).

6.  Create a new Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

---

## 📧 Contact

For any questions or feedback, feel free to reach out:

* **Your Name/Handle:** [Your GitHub Username/LinkedIn Profile]

* **Email:** [Your Email Address]
