"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageCircle, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TicketDetails = ({ params }) => {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ticketCode = params.id; // Access route parameter from props

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/tickets/${ticketCode}`
        );
        if (!response.ok) throw new Error("Ticket not found");
        const data = await response.json();
        setTicket(data);
        // Fetch comments if you have a separate endpoint
        // const commentsResponse = await fetch(`http://localhost:8081/api/tickets/${ticketCode}/comments`);
        // const commentsData = await commentsResponse.json();
        // setComments(commentsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ticketCode) {
      fetchTicketDetails();
    }
  }, [ticketCode]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // Add comment to the backend
      // await fetch(`http://localhost:8081/api/tickets/${ticketCode}/comments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: newComment }),
      // });

      // Optimistically update UI
      const newCommentObj = {
        id: Date.now(),
        content: newComment,
        createdAt: new Date().toISOString(),
        author: "Support Staff", // Replace with actual user info
      };

      setComments((prev) => [...prev, newCommentObj]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  if (!ticket) return null;

  const getStatusColor = (status) => {
    const statusColors = {
      Open: "bg-yellow-500",
      "In Progress": "bg-blue-500",
      Hold: "bg-orange-500",
      Resolved: "bg-green-500",
      Closed: "bg-gray-500",
    };
    return statusColors[status] || "bg-gray-500";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Ticket #{ticket.TicketCode}
            </CardTitle>
            <span
              className={`${getStatusColor(
                ticket.Status
              )} text-white px-3 py-1 rounded-full text-sm`}
            >
              {ticket.Status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-600">Title</h3>
                <p>{ticket.Title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-600">Priority</h3>
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {ticket.Priority}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-600">Created By</h3>
                <p>{ticket.CreatedBy}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-600">Date Created</h3>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(ticket.Date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-600">Description</h3>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                {ticket.Description}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-600 mb-4">
                Communication Trail
              </h3>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCommentSubmit} className="mt-6">
                <div className="flex flex-col space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send Response
                  </button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetails;