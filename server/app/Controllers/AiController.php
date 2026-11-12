<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use App\Services\AiFinancialAssistant;

class AiController extends Controller
{
    public function query(Request $request): Response
    {
        $prompt = trim($request->input('query', ''));
        if (empty($prompt)) {
            return $this->error('Query parameter is required', 422);
        }

        try {
            $result = AiFinancialAssistant::answerFinancialQuery($prompt);
            return $this->success($result);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function anomalies(Request $request): Response
    {
        try {
            $result = AiFinancialAssistant::detectAnomalies();
            return $this->success($result);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function health(Request $request): Response
    {
        try {
            $result = AiFinancialAssistant::getFinancialHealthSummary();
            return $this->success($result);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function explain(Request $request): Response
    {
        $type = $request->input('type', 'SALES_INVOICE');
        $id = (int)$request->input('id');

        if ($id <= 0) {
            return $this->error('Valid transaction id is required', 422);
        }

        try {
            $result = AiFinancialAssistant::explainTransaction($type, $id);
            return $this->success($result);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
