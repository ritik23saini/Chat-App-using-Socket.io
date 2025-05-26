import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  unreadMessages: {}, 
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error fetching users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // 🔴 Unread message logic
  incrementUnread: (senderId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [senderId]: (state.unreadMessages[senderId] || 0) + 1,
      },
    }));
  },

  clearUnread: (senderId) => {
    set((state) => {
      const updated = { ...state.unreadMessages };
      delete updated[senderId];
      return { unreadMessages: updated };
    });
  },

  setSelectedUser: (selectedUser) => {
    get().clearUnread(selectedUser._id); // Clear unread badge when user is selected
    set({ selectedUser });
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, incrementUnread } = get();

      const isFromSelectedUser = newMessage.senderId === selectedUser?._id;

      if (isFromSelectedUser) {
        // Update chat if the current user is open
        set({ messages: [...messages, newMessage] });
      } else {
        // Show notification + increment unread
        toast.success("📩 New message received");
        incrementUnread(newMessage.senderId);
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
}));
