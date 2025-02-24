import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Container, 
    Alert,
    Link,
    Paper
} from '@mui/material';
import { registerSchema, type RegisterSchema } from 'shared';
import { ZodError } from 'zod';

/**
 * Register component that handles user registration with form validation
 * Uses MUI components for the UI and Zod for form validation
 */
const Register: React.FC = () => {
    const navigate = useNavigate();
    
    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    
    // Error handling state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handles input changes and clears related errors
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for the field being edited
        setErrors(prev => ({ ...prev, [name]: '' }));
        setApiError('');
    };

    /**
     * Validates form data and submits to the registration endpoint
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setApiError('');

        try {
            // Validate form data using Zod schema
            const validatedData: RegisterSchema = registerSchema.parse(formData);

            // Submit to backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(validatedData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store the JWT token
            localStorage.setItem('token', data.token);
            
            // Redirect to tasks page on success
            navigate('/tasks');

        } catch (err: unknown) {
            if (err instanceof ZodError) {
                // Handle validation errors
                const newErrors: Record<string, string> = {};
                err.errors.forEach((error) => {
                    if (error.path.length > 0) {
                        const path = String(error.path[0]);
                        newErrors[path] = error.message;
                    }
                });
                setErrors(newErrors);
            } else {
                // Handle API or other errors
                const error = err as Error;
                setApiError(error.message || 'An error occurred during registration');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography component="h1" variant="h5">
                        Register
                    </Typography>

                    {apiError && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {apiError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={formData.username}
                            onChange={handleInputChange}
                            error={!!errors.username}
                            helperText={errors.username}
                            disabled={isLoading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleInputChange}
                            error={!!errors.password}
                            helperText={errors.password}
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link href="/login" variant="body2">
                                Already have an account? Sign in
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
