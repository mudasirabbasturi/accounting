<?php
namespace Core;

class Validator
{
    private array $data;
    private array $rules;
    private array $errors = [];

    public function __construct(array $data, array $rules)
    {
        $this->data = $data;
        $this->rules = $rules;
    }

    public function validate(): bool
    {
        $this->errors = [];

        foreach ($this->rules as $field => $ruleString) {
            $ruleList = is_array($ruleString) ? $ruleString : explode('|', $ruleString);
            $value = $this->data[$field] ?? null;

            foreach ($ruleList as $rule) {
                $params = [];
                if (str_contains($rule, ':')) {
                    list($ruleName, $paramStr) = explode(':', $rule, 2);
                    $params = explode(',', $paramStr);
                } else {
                    $ruleName = $rule;
                }

                $ruleName = trim($ruleName);

                if ($ruleName === 'required') {
                    if ($value === null || $value === '' || (is_array($value) && empty($value))) {
                        $this->addError($field, "The {$field} field is required.");
                        break;
                    }
                }

                // If not required and empty, skip remaining validations
                if ($value === null || $value === '') {
                    continue;
                }

                if ($ruleName === 'numeric' && !is_numeric($value)) {
                    $this->addError($field, "The {$field} must be a number.");
                }

                if ($ruleName === 'integer' && !filter_var($value, FILTER_VALIDATE_INT) && $value !== 0 && $value !== '0') {
                    $this->addError($field, "The {$field} must be an integer.");
                }

                if ($ruleName === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "The {$field} must be a valid email address.");
                }

                if ($ruleName === 'array' && !is_array($value)) {
                    $this->addError($field, "The {$field} must be an array.");
                }

                if ($ruleName === 'in' && !in_array($value, $params)) {
                    $this->addError($field, "The {$field} must be one of: " . implode(', ', $params));
                }

                if ($ruleName === 'min') {
                    $min = (float)($params[0] ?? 0);
                    if (is_numeric($value) && (float)$value < $min) {
                        $this->addError($field, "The {$field} must be at least {$min}.");
                    } elseif (is_string($value) && mb_strlen($value) < $min) {
                        $this->addError($field, "The {$field} must be at least {$min} characters.");
                    }
                }

                if ($ruleName === 'max') {
                    $max = (float)($params[0] ?? 0);
                    if (is_numeric($value) && (float)$value > $max) {
                        $this->addError($field, "The {$field} may not be greater than {$max}.");
                    } elseif (is_string($value) && mb_strlen($value) > $max) {
                        $this->addError($field, "The {$field} may not be greater than {$max} characters.");
                    }
                }

                if ($ruleName === 'date' && !strtotime($value)) {
                    $this->addError($field, "The {$field} is not a valid date.");
                }
            }
        }

        return empty($this->errors);
    }

    private function addError(string $field, string $message): void
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}
