import { AuthenticationError } from 'apollo-server-errors';
import User from '../models/User.js';
import { signToken } from '../middleware/Auth.js'; // Import signToken instead of authMiddleware
const resolvers = {
    Query: {
        getSingleUser: async (_, { id, username }) => {
            return await User.findOne({
                $or: [{ _id: id }, { username }]
            });
        },
        me: async (_, __, context) => {
            if (context.user) {
                return await User.findById(context.user._id);
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
    Mutation: {
        createUser: async (_, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            if (!user) {
                throw new Error('Something went wrong!');
            }
            const token = signToken(user.username, user.email, user._id); // Use signToken to generate JWT
            return { token, user };
        },
        login: async (_, { username, email, password }) => {
            const user = await User.findOne({
                $or: [{ username }, { email }]
            });
            if (!user) {
                throw new AuthenticationError("Can't find this user");
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Wrong password!');
            }
            const token = signToken(user.username, user.email, user._id); // Use signToken to generate JWT
            return { token, user };
        },
        saveBook: async (_, { bookInput }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            // Find and update the user
            const updatedUser = await User.findByIdAndUpdate(context.user._id, { $addToSet: { savedBooks: bookInput } }, // Add book to savedBooks if not already in the list
            { new: true, runValidators: true }).exec();
            if (!updatedUser) {
                throw new Error('User not found');
            }
            return updatedUser; // ✅ Return full user object
        },
        deleteBook: async (_, { bookId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            return await User.findByIdAndUpdate(context.user._id, { $pull: { savedBooks: { bookId } } }, { new: true });
        },
    },
};
export default resolvers;
//# sourceMappingURL=resolvers.js.map