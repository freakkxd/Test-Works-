<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'phone', 'course_id', 'enrolled_at'];

    protected $casts = ['enrolled_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function progress()
    {
        return $this->hasMany(Progress::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    /** Процент завершения курса */
    public function getCompletionPercentAttribute(): float
    {
        $totalLessons = $this->course?->lessons()->count() ?? 0;
        if ($totalLessons === 0) return 0;

        $completed = $this->progress()->where('completed', true)->count();
        return round(($completed / $totalLessons) * 100, 1);
    }
}
