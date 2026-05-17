import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Review type definition
export type ReviewType = 'AGENCE' | 'GUIDE';

export type Comment = {
    id: number;
    userId: number;
    userName: string;
    text: string;
    timestamp: number;
    userImage?: any;
    replies?: Comment[]; // Support for nested replies
    parentId?: number; // ID of parent comment if this is a reply
};

export type Review = {
    id: number;
    name: string;
    entityName: string;
    type: ReviewType;
    rating: number;
    comment: string;
    image: any;
    date: string;
    timestamp: number;
    comments?: Comment[];
    userId?: number; // Add userId to track review author
};

// Initial Mock Data
const initialReviews: Review[] = [
    {
        id: 1,
        name: 'Raouf Gharbi',
        entityName: 'Omra Express',
        type: 'AGENCE',
        rating: 4.5,
        comment: 'Très bonne expérience avec cette agence, équipe professionnelle et attentionnée. Le voyage s\'est déroulé sans aucun problème.',
        image: require('../assets/images/user1.jpg'),
        date: 'Il y a 2 jours',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        userId: 1,
        comments: [
            { id: 101, userId: 99, userName: 'Ali', text: 'Merci pour le partage !', timestamp: Date.now(), replies: [] }
        ]
    },
    {
        id: 2,
        name: 'Fatima Nouira',
        entityName: 'Pèlerin Premium',
        type: 'AGENCE',
        rating: 5,
        comment: 'Excellent service! Tous les détails étaient parfaits. Les hôtels, les transports, tout était extraordinaire. Je recommande vivement!',
        image: require('../assets/images/user2.jpg'),
        date: 'Il y a 5 jours',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        userId: 2,
        comments: []
    },
    {
        id: 3,
        name: 'Ahmed Ben Ali',
        entityName: 'Guide Youssef',
        type: 'GUIDE',
        rating: 5,
        comment: 'Un guide exceptionnel, très patient et savant. Il nous a fait découvrir les lieux saints avec une grande spiritualité.',
        image: require('../assets/images/user3.jpg'),
        date: 'Il y a 1 semaine',
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        userId: 3,
        comments: []
    },
    {
        id: 4,
        name: 'Yassine Karim',
        entityName: 'Journey to Holiness',
        type: 'AGENCE',
        rating: 4.5,
        comment: 'Service impeccable, logements confortables et nourriture délicieuse. Les accompagnateurs étaient très bienveillants.',
        image: require('../assets/images/user4.jpg'),
        date: 'Il y a 10 jours',
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
        userId: 4,
        comments: []
    },
    {
        id: 5,
        name: 'Karim Zied',
        entityName: 'Guide Ibrahim',
        type: 'GUIDE',
        rating: 4,
        comment: 'Guide très compétent et disponible. Une belle expérience humaine.',
        image: require('../assets/images/user1.jpg'),
        date: 'Il y a 2 semaines',
        timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
        userId: 5,
        comments: []
    },
];

interface ReviewsState {
    reviews: Review[];
    savedPostIds: number[];
}

const initialState: ReviewsState = {
    reviews: initialReviews,
    savedPostIds: [],
};

const reviewsSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        addReview: (state, action: PayloadAction<Review>) => {
            state.reviews.unshift(action.payload);
        },
        addComment: (state, action: PayloadAction<{ reviewId: number; comment: Comment }>) => {
            const review = state.reviews.find(r => r.id === action.payload.reviewId);
            if (review) {
                if (!review.comments) review.comments = [];
                review.comments.push(action.payload.comment);
            }
        },
        updateComment: (state, action: PayloadAction<{ reviewId: number; commentId: number; newText: string }>) => {
            const review = state.reviews.find(r => r.id === action.payload.reviewId);
            if (review && review.comments) {
                const comment = review.comments.find(c => c.id === action.payload.commentId);
                if (comment) {
                    comment.text = action.payload.newText;
                    comment.timestamp = Date.now(); // Update timestamp
                }
            }
        },
        deleteComment: (state, action: PayloadAction<{ reviewId: number; commentId: number }>) => {
            const review = state.reviews.find(r => r.id === action.payload.reviewId);
            if (review && review.comments) {
                review.comments = review.comments.filter(c => c.id !== action.payload.commentId);
            }
        },
        addReply: (state, action: PayloadAction<{ reviewId: number; commentId: number; reply: Comment }>) => {
            const review = state.reviews.find(r => r.id === action.payload.reviewId);
            if (review && review.comments) {
                const comment = review.comments.find(c => c.id === action.payload.commentId);
                if (comment) {
                    if (!comment.replies) comment.replies = [];
                    comment.replies.push(action.payload.reply);
                }
            }
        },
        updateReply: (state, action: PayloadAction<{ reviewId: number; commentId: number; replyId: number; newText: string }>) => {
            const review = state.reviews.find(r => r.id === action.payload.reviewId);
            if (review && review.comments) {
                const comment = review.comments.find(c => c.id === action.payload.commentId);
                if (comment && comment.replies) {
                    const reply = comment.replies.find(r => r.id === action.payload.replyId);
                    if (reply) {
                        reply.text = action.payload.newText;
                        reply.timestamp = Date.now();
                    }
                }
            }
        },
        deleteReply: (state, action: PayloadAction<{ reviewId: number; commentId: number; replyId: number }>) => {
            const review = state.reviews.find(r => r.id === action.payload.reviewId);
            if (review && review.comments) {
                const comment = review.comments.find(c => c.id === action.payload.commentId);
                if (comment && comment.replies) {
                    comment.replies = comment.replies.filter(r => r.id !== action.payload.replyId);
                }
            }
        },
        deleteReview: (state, action: PayloadAction<number>) => {
            state.reviews = state.reviews.filter(r => r.id !== action.payload);
            // Also remove from saved posts if it was saved
            state.savedPostIds = state.savedPostIds.filter(id => id !== action.payload);
        },
        toggleSavePost: (state, action: PayloadAction<number>) => {
            const index = state.savedPostIds.indexOf(action.payload);
            if (index > -1) {
                // Remove from saved
                state.savedPostIds.splice(index, 1);
            } else {
                // Add to saved
                state.savedPostIds.push(action.payload);
            }
        },
    },
});

export const {
    addReview,
    addComment,
    updateComment,
    deleteComment,
    addReply,
    updateReply,
    deleteReply,
    deleteReview,
    toggleSavePost
} = reviewsSlice.actions;
export default reviewsSlice.reducer;
