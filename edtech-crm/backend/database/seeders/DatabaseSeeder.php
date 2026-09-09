<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Student;
use App\Models\Schedule;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Пользователи с ролями
        $admin = User::create([
            'name' => 'Администратор',
            'email' => 'admin@edtech.ru',
            'password' => Hash::make('admin123'),
            'role' => User::ROLE_ADMIN,
        ]);

        $manager = User::create([
            'name' => 'Менеджер Иван',
            'email' => 'manager@edtech.ru',
            'password' => Hash::make('manager123'),
            'role' => User::ROLE_MANAGER,
        ]);

        $teacher = User::create([
            'name' => 'Преподаватель Анна',
            'email' => 'teacher@edtech.ru',
            'password' => Hash::make('teacher123'),
            'role' => User::ROLE_TEACHER,
        ]);

        // Курсы
        $webDev = Course::create([
            'name' => 'Fullstack Web Development',
            'description' => 'React + Node.js + PostgreSQL',
            'duration_hours' => 120,
            'price' => 89000,
        ]);

        $python = Course::create([
            'name' => 'Python для Data Science',
            'description' => 'Python, Pandas, ML basics',
            'duration_hours' => 80,
            'price' => 65000,
        ]);

        // Уроки
        $webLessons = [
            'HTML & CSS основы', 'JavaScript ES6+', 'React компоненты',
            'State management', 'Node.js API', 'PostgreSQL', 'Дипломный проект',
        ];
        foreach ($webLessons as $i => $title) {
            Lesson::create(['course_id' => $webDev->id, 'title' => $title, 'order' => $i + 1]);
        }

        $pyLessons = ['Python основы', 'NumPy & Pandas', 'Визуализация данных', 'ML intro', 'Финальный проект'];
        foreach ($pyLessons as $i => $title) {
            Lesson::create(['course_id' => $python->id, 'title' => $title, 'order' => $i + 1]);
        }

        // Студенты
        $students = [
            ['name' => 'Алексей Петров', 'email' => 'alex@mail.ru', 'phone' => '+79001234567', 'course_id' => $webDev->id],
            ['name' => 'Мария Сидорова', 'email' => 'maria@mail.ru', 'phone' => '+79007654321', 'course_id' => $webDev->id],
            ['name' => 'Дмитрий Козлов', 'email' => 'dmitry@mail.ru', 'phone' => '+79009876543', 'course_id' => $python->id],
            ['name' => 'Елена Новикова', 'email' => 'elena@mail.ru', 'phone' => '+79005556677', 'course_id' => $python->id],
            ['name' => 'Игорь Волков', 'email' => 'igor@mail.ru', 'phone' => '+79001112233', 'course_id' => $webDev->id],
        ];

        foreach ($students as $s) {
            $student = Student::create(array_merge($s, ['enrolled_at' => now()->subDays(rand(10, 60))]));

            Payment::create([
                'student_id' => $student->id,
                'amount' => $student->course_id === $webDev->id ? 89000 : 65000,
                'due_date' => now()->addDays(30),
                'status' => rand(0, 1) ? 'paid' : 'pending',
                'paid_at' => rand(0, 1) ? now() : null,
                'description' => 'Оплата курса',
            ]);
        }

        // Расписание на неделю
        for ($day = 0; $day < 7; $day++) {
            Schedule::create([
                'title' => 'Занятие: ' . $webLessons[$day % count($webLessons)],
                'teacher_id' => $teacher->id,
                'group_name' => 'Группа A',
                'room' => 'Каб. ' . (101 + $day),
                'starts_at' => now()->startOfWeek()->addDays($day)->setHour(10),
                'ends_at' => now()->startOfWeek()->addDays($day)->setHour(12),
                'course_id' => $webDev->id,
            ]);
        }
    }
}
