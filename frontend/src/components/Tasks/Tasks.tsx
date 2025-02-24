import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, 
    TextField, 
    Box, 
    Typography, 
    Card, 
    CardContent, 
    CardActions,
    Container,
    Stack,
    AppBar,
    Toolbar
} from '@mui/material';

// Define Task interface based on our backend model
interface Task {
    id: string;
    title: string;
    description?: string;
    isComplete: boolean;
}

// Add interface for validation error detail
interface ValidationError {
    message: string;
    path: string[];
    code: string;
}

const Tasks: React.FC = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');

    // Handle unauthorized responses
    const handleUnauthorized = () => {
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login'); // Redirect to login
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Fetch tasks on component mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                handleUnauthorized();
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
                headers: { 
                    Authorization: token,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent creation if the title is empty
        if (!newTaskTitle.trim()) {
            // You can show an alert or set an error message in state
            alert('Task title cannot be empty.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                handleUnauthorized();
                return;
            }

            const requestBody = {
                title: newTaskTitle.trim(),  // Trim whitespace
                description: newTaskDescription.trim() || undefined  // Trim and convert empty string to undefined
            };

            console.log('Sending task creation request:', requestBody);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Task creation failed:', errorData);
                
                // Log detailed validation errors, if any
                if (errorData.details) {
                    errorData.details.forEach((detail: ValidationError) => {
                        console.error(`Validation error: ${detail.message} (${detail.path.join('.')})`);
                    });
                }
                
                throw new Error(errorData.error || 'Failed to create task');
            }

            setNewTaskTitle('');
            setNewTaskDescription('');
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token || '',
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!response.ok) throw new Error('Failed to delete task');
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': token || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!response.ok) throw new Error('Failed to update task');
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    return (
        <>
            <AppBar position="static" sx={{ mb: 4 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Tasks
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={handleLogout}
                        aria-label="logout"
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth="md">
                <Box sx={{ py: 4 }}>
                    {/* Create Task Form */}
                    <Box component="form" onSubmit={createTask} sx={{ mb: 4 }}>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                label="Task title"
                                required
                                size="small"
                            />
                            <TextField
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                label="Description (optional)"
                                size="small"
                            />
                            <Button type="submit" variant="contained" color="primary">
                                Add Task
                            </Button>
                        </Stack>
                    </Box>

                    {/* Task List */}
                    <Stack spacing={2}>
                        {tasks.map((task) => (
                            <Card key={task.id}>
                                <CardContent>
                                    <Typography variant="h6">{task.title}</Typography>
                                    {task.description && (
                                        <Typography color="text.secondary">
                                            {task.description}
                                        </Typography>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Button
                                        onClick={() => updateTask(task.id, { isComplete: !task.isComplete })}
                                        variant="contained"
                                        color={task.isComplete ? "success" : "inherit"}
                                        size="small"
                                    >
                                        {task.isComplete ? 'Completed' : 'Mark Complete'}
                                    </Button>
                                    <Button
                                        onClick={() => deleteTask(task.id)}
                                        variant="contained"
                                        color="error"
                                        size="small"
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        ))}
                    </Stack>
                </Box>
            </Container>
        </>
    );
};

export default Tasks;
