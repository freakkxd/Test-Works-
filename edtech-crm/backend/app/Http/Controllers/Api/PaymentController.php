<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with('student');

        if ($studentId = $request->get('student_id')) {
            $query->where('student_id', $studentId);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return $query->orderBy('due_date', 'desc')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $data['status'] = Payment::STATUS_PENDING;

        return Payment::create($data)->load('student');
    }

    public function show(Payment $payment)
    {
        return $payment->load('student');
    }

    public function update(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|in:pending,paid,overdue',
            'description' => 'nullable|string',
        ]);

        if (isset($data['status']) && $data['status'] === Payment::STATUS_PAID) {
            $data['paid_at'] = now();
        }

        $payment->update($data);

        return $payment->load('student');
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->json(['message' => 'Платёж удалён']);
    }

    /** Экспорт платежей в CSV */
    public function exportCsv(Request $request)
    {
        $query = Payment::with('student');

        if ($studentId = $request->get('student_id')) {
            $query->where('student_id', $studentId);
        }

        $payments = $query->get();

        $csv = "ID,Студент,Сумма,Срок,Статус,Оплачено\n";
        foreach ($payments as $p) {
            $csv .= implode(',', [
                $p->id,
                '"' . $p->student->name . '"',
                $p->amount,
                $p->due_date->format('Y-m-d'),
                $p->status,
                $p->paid_at?->format('Y-m-d') ?? '',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="payments.csv"',
        ]);
    }
}
