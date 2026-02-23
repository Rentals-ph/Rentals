<?php

namespace App\Http\Controllers\Concerns;

trait FormatsValidationErrors
{
    /**
     * Format validation errors into user-friendly messages.
     *
     * @param array $errors
     * @return array
     */
    protected function formatValidationErrors(array $errors): array
    {
        $errorMessages = [];
        
        foreach ($errors as $field => $messages) {
            foreach ($messages as $message) {
                $fieldName = str_replace('_', ' ', $field);
                $fieldName = ucwords($fieldName);
                
                // Add specific error messages
                if (str_contains($message, 'required')) {
                    $errorMessages[] = "{$fieldName} is required. Please provide a value.";
                } elseif (str_contains($message, 'email')) {
                    $errorMessages[] = "{$fieldName} must be a valid email address (e.g., example@gmail.com).";
                } elseif (str_contains($message, 'numeric')) {
                    $errorMessages[] = "{$fieldName} must be a valid number.";
                } elseif (str_contains($message, 'integer')) {
                    $errorMessages[] = "{$fieldName} must be a whole number.";
                } elseif (str_contains($message, 'min')) {
                    $errorMessages[] = "{$fieldName} is too small. Please check the minimum value requirement.";
                } elseif (str_contains($message, 'max')) {
                    $errorMessages[] = "{$fieldName} is too large or too long. Please check the maximum value/length.";
                } elseif (str_contains($message, 'url')) {
                    $errorMessages[] = "{$fieldName} must be a valid URL (e.g., https://example.com).";
                } elseif (str_contains($message, 'image')) {
                    $errorMessages[] = "{$fieldName} must be a valid image file (JPEG, JPG, or PNG).";
                } elseif (str_contains($message, 'mimes')) {
                    $errorMessages[] = "{$fieldName} file type is not supported. Please check the allowed file types.";
                } else {
                    $errorMessages[] = "{$fieldName}: {$message}";
                }
            }
        }
        
        return $errorMessages;
    }

    /**
     * Return a formatted validation error response.
     *
     * @param \Illuminate\Validation\ValidationException $e
     * @return \Illuminate\Http\JsonResponse
     */
    protected function validationErrorResponse(\Illuminate\Validation\ValidationException $e)
    {
        $errors = $e->errors();
        $errorMessages = $this->formatValidationErrors($errors);
        
        return response()->json([
            'success' => false,
            'message' => 'Validation failed. Please check the following errors:',
            'errors' => $errors,
            'error_messages' => $errorMessages,
        ], 422);
    }
}

