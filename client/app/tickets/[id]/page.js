"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageCircle, Clock, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TicketDetails = ({ params }) => {
  const [ticket, setTicket] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedTicket, setEditedTicket] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const ticketCode = params.id;
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Decode token to get user data
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      setUserData(JSON.parse(jsonPayload));
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem('token');
      router.push('/');
      return;
    }

    const fetchTicketDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8081/api/tickets/${ticketCode}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        setTicket(response.data);
        setEditedTicket(response.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          router.push('/');
        } else {
          setError(err.response?.data?.error || "Failed to fetch ticket details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketCode, router]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const commentedBy = userData.role === 'admin' ? 'Support Team' : userData.username;

      const response = await axios.post(
        `http://localhost:8081/api/tickets/${ticketCode}/comments`,
        {
          commentText: newComment,
          commentedBy: commentedBy
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update the ticket's comments array with the new comment
      setTicket(prevTicket => ({
        ...prevTicket,
        comments: [
          {
            CommentID: response.data.commentId,
            CommentedBy: commentedBy,
            CommentDate: new Date().toISOString(),
            CommentText: newComment,
            TicketCode: ticketCode
          },
          ...(prevTicket.comments || [])
        ]
      }));

      setNewComment("");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/');
      } else {
        setError("There was an error submitting your comment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8081/api/tickets/${ticketCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Check user role and redirect accordingly
      if (userData.role === 'admin') {
        router.push('/dashboard-admin');
      } else {
        router.push('/dashboard-employee');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/');
      } else {
        setError("Failed to delete ticket");
      }
    }
  };

  const handleBackClick = () => {
    // Check user role and navigate accordingly
    if (userData.role === 'admin') {
      router.push('/dashboard-admin');
    } else {
      router.push('/dashboard-employee');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8081/api/tickets/${ticketCode}`,
        {
          title: editedTicket.Title,
          description: editedTicket.Description,
          status: editedTicket.Status,
          priority: editedTicket.Priority
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Fetch updated ticket details
      const response = await axios.get(
        `http://localhost:8081/api/tickets/${ticketCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTicket(response.data);
      setEditedTicket(response.data);
      setEditDialogOpen(false);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/');
      } else {
        setError("Failed to update ticket");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="outline" onClick={handleBackClick} className="mb-4">
          <X className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        
        {userData?.role === 'admin' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : ticket ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{ticket.Title}</CardTitle>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-gray-500">#{ticket.TicketCode}</span>
                <span className={`px-2 py-1 rounded-full text-xs text-white ${
                  ticket.Status === "Open" ? "bg-yellow-500" :
                  ticket.Status === "In Progress" ? "bg-blue-500" :
                  "bg-green-500"
                }`}>
                  {ticket.Status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs text-white ${
                  ticket.Priority === "High" ? "bg-red-500" :
                  ticket.Priority === "Medium" ? "bg-yellow-500" :
                  "bg-green-500"
                }`}>
                  {ticket.Priority}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{ticket.Description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Created: {new Date(ticket.Date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Created by: {ticket.CreatedBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Comments</h2>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div className="flex gap-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              {ticket.comments?.map((comment) => (
                <Card key={comment.CommentID}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{comment.CommentedBy}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(comment.CommentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.CommentText}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Ticket not found</AlertDescription>
        </Alert>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTicket?.Title || ""}
                onChange={(e) =>
                  setEditedTicket({ ...editedTicket, Title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedTicket?.Description || ""}
                onChange={(e) =>
                  setEditedTicket({
                    ...editedTicket,
                    Description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editedTicket?.Status || ""}
                onValueChange={(value) =>
                  setEditedTicket({ ...editedTicket, Status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={editedTicket?.Priority || ""}
                onValueChange={(value) =>
                  setEditedTicket({ ...editedTicket, Priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketDetails;
