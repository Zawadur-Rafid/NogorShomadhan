import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface DbFeedbackReply {
  reply_id: string;
  feedback_id: string;
  acc_id: string;
  message: string;
  created_at: string;
  account?: {
    full_name: string;
    role: string;
  } | null;
}

export interface DbComplaintFeedback {
  feedback_id: string;
  comp_id: string;
  acc_id: string;
  rating: number;
  comment: string;
  created_at: string;
  account?: {
    full_name: string;
    role: string;
  } | null;
  replies?: DbFeedbackReply[];
  complaints?: {
    comp_id: string;
    title: string;
    category: string;
    status: string;
    house?: string;
    road?: string;
    avenue?: string;
    nearby_landmark?: string;
  } | null;
}

export const feedbackService = {
  /**
   * Fetch all feedback and authority replies for a specific complaint.
   */
  async fetchFeedbackForComplaint(compId: string): Promise<DbComplaintFeedback[]> {
    try {
      const { data: feedbackRows, error: feedbackError } = await supabase
        .from('complaint_feedback')
        .select(`
          *,
          account:account!acc_id(full_name, role)
        `)
        .eq('comp_id', compId)
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.warn('Supabase fetch error for complaint_feedback:', feedbackError.message);
        return [];
      }

      if (!feedbackRows || feedbackRows.length === 0) return [];

      const feedbackIds = feedbackRows.map((f) => f.feedback_id);

      const { data: replyRows, error: repliesError } = await supabase
        .from('feedback_replies')
        .select(`
          *,
          account:account!acc_id(full_name, role)
        `)
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.warn('Supabase fetch error for feedback_replies:', repliesError.message);
      }

      const allReplies: DbFeedbackReply[] = replyRows || [];

      return feedbackRows.map((item) => ({
        ...item,
        replies: allReplies.filter((r) => r.feedback_id === item.feedback_id),
      }));
    } catch (e) {
      console.error('Unexpected error in fetchFeedbackForComplaint:', e);
      return [];
    }
  },

  /**
   * Fetch all feedback with associated complaint information and replies (for Authority Feedback Center).
   */
  async fetchAllFeedback(): Promise<DbComplaintFeedback[]> {
    try {
      const { data: feedbackRows, error: feedbackError } = await supabase
        .from('complaint_feedback')
        .select(`
          *,
          account:account!acc_id(full_name, role),
          complaints:complaints!comp_id(comp_id, title, category, status, house, road, avenue, nearby_landmark)
        `)
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.warn('Supabase fetch error for all complaint_feedback:', feedbackError.message);
        return [];
      }

      if (!feedbackRows || feedbackRows.length === 0) return [];

      const feedbackIds = feedbackRows.map((f) => f.feedback_id);

      const { data: replyRows, error: repliesError } = await supabase
        .from('feedback_replies')
        .select(`
          *,
          account:account!acc_id(full_name, role)
        `)
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.warn('Supabase fetch error for all feedback_replies:', repliesError.message);
      }

      const allReplies: DbFeedbackReply[] = replyRows || [];

      return feedbackRows.map((item) => ({
        ...item,
        replies: allReplies.filter((r) => r.feedback_id === item.feedback_id),
      }));
    } catch (e) {
      console.error('Unexpected error in fetchAllFeedback:', e);
      return [];
    }
  },

  /**
   * Submit a resident's star rating (1-5) and feedback comment for a resolved complaint.
   */
  async submitComplaintFeedback(params: {
    compId: string;
    rating: number;
    comment: string;
    accId?: string;
  }): Promise<DbComplaintFeedback | null> {
    try {
      let residentAccId = params.accId;
      if (!residentAccId) {
        residentAccId = (await AsyncStorage.getItem('acc_id')) || undefined;
      }

      if (!residentAccId) {
        // Fallback query to find current user or first resident
        const { data: fallbackAcc } = await supabase
          .from('account')
          .select('acc_id')
          .limit(1)
          .single();
        residentAccId = fallbackAcc?.acc_id;
      }

      if (!residentAccId) {
        throw new Error('No user account found to submit feedback.');
      }

      const { data, error } = await supabase
        .from('complaint_feedback')
        .insert([
          {
            comp_id: params.compId,
            acc_id: residentAccId,
            rating: Math.max(1, Math.min(5, Math.round(params.rating))),
            comment: params.comment.trim(),
          },
        ])
        .select(`
          *,
          account:account!acc_id(full_name, role)
        `)
        .single();

      if (error) {
        console.warn('Supabase insert error for complaint_feedback:', error.message);
        return null;
      }

      return {
        ...data,
        replies: [],
      };
    } catch (e: any) {
      console.warn('submitComplaintFeedback error:', e?.message || e);
      return null;
    }
  },

  /**
   * Submit an authority's reply to a specific resident feedback comment.
   */
  async submitFeedbackReply(params: {
    feedbackId: string;
    message: string;
    accId?: string;
  }): Promise<DbFeedbackReply | null> {
    try {
      let authorityAccId = params.accId;
      if (!authorityAccId) {
        authorityAccId = (await AsyncStorage.getItem('acc_id')) || undefined;
      }

      if (!authorityAccId) {
        // Find authority account
        const { data: authAcc } = await supabase
          .from('account')
          .select('acc_id')
          .eq('role', 'authority')
          .limit(1)
          .single();
        authorityAccId = authAcc?.acc_id;
      }

      if (!authorityAccId) {
        const { data: fallbackAcc } = await supabase
          .from('account')
          .select('acc_id')
          .limit(1)
          .single();
        authorityAccId = fallbackAcc?.acc_id;
      }

      if (!authorityAccId) {
        throw new Error('No authority account found to submit reply.');
      }

      const { data, error } = await supabase
        .from('feedback_replies')
        .insert([
          {
            feedback_id: params.feedbackId,
            acc_id: authorityAccId,
            message: params.message.trim(),
          },
        ])
        .select(`
          *,
          account:account!acc_id(full_name, role)
        `)
        .single();

      if (error) {
        console.warn('Supabase insert error for feedback_replies:', error.message);
        return null;
      }

      return data;
    } catch (e: any) {
      console.warn('submitFeedbackReply error:', e?.message || e);
      return null;
    }
  },
};
