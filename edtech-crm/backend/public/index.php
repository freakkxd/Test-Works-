<?php
/**
 * EdTech CRM — Demo API Server
 * Standalone PDO API для демонстрационной версии Northstar Demo.
 * Все данные синтетические.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    getenv('DB_HOST') ?: 'mysql',
    getenv('DB_PORT') ?: '3306',
    getenv('DB_DATABASE') ?: 'edtech_crm'
);

try {
    $pdo = new PDO($dsn, getenv('DB_USERNAME') ?: 'root', getenv('DB_PASSWORD') ?: 'secret', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(['error' => 'Database unavailable', 'message' => $e->getMessage()]);
    exit;
}

initSchema($pdo);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/api#', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Routing
try {
    if ($uri === '/health' && $method === 'GET') {
        jsonResponse(['status' => 'ok', 'timestamp' => date('c'), 'students' => countRows($pdo, 'students')]);
    } elseif ($uri === '/login' && $method === 'POST') {
        handleLogin($pdo, $body);
    } elseif ($uri === '/me' && $method === 'GET') {
        requireAuth($pdo);
        jsonResponse(getUser($pdo, $GLOBALS['userId']));
    } elseif ($uri === '/demo/seed' && $method === 'POST') {
        seedDemo($pdo, true);
        jsonResponse(['message' => 'Demo data seeded', 'disclaimer' => 'Все данные синтетические.']);
    } elseif ($uri === '/dashboard' && $method === 'GET') {
        jsonResponse(getDashboard($pdo));
    } elseif ($uri === '/students' && $method === 'GET') {
        jsonResponse(getStudents($pdo, $_GET));
    } elseif (preg_match('#^/students/(\d+)$#', $uri, $m) && $method === 'GET') {
        jsonResponse(getStudent($pdo, $m[1]));
    } elseif ($uri === '/students' && $method === 'POST') {
        jsonResponse(createStudent($pdo, $body), 201);
    } elseif ($uri === '/schedules' && $method === 'GET') {
        jsonResponse(getSchedules($pdo, $_GET));
    } elseif ($uri === '/schedules' && $method === 'POST') {
        jsonResponse(createSchedule($pdo, $body), 201);
    } elseif ($uri === '/payments' && $method === 'GET') {
        jsonResponse(getPayments($pdo, $_GET));
    } elseif ($uri === '/payments' && $method === 'POST') {
        jsonResponse(createPayment($pdo, $body), 201);
    } elseif (preg_match('#^/payments/(\d+)$#', $uri, $m) && $method === 'PUT') {
        jsonResponse(updatePayment($pdo, $m[1], $body));
    } elseif ($uri === '/payments/export/csv' && $method === 'GET') {
        exportPaymentsCsv($pdo);
    } elseif ($uri === '/students/export' && $method === 'GET') {
        exportStudentsCsv($pdo);
    } elseif (preg_match('#^/students/(\d+)/progress$#', $uri, $m) && $method === 'GET') {
        jsonResponse(getProgress($pdo, $m[1]));
    } elseif (preg_match('#^/students/(\d+)/progress/(\d+)$#', $uri, $m) && $method === 'POST') {
        jsonResponse(toggleProgress($pdo, $m[1], $m[2]));
    } elseif (preg_match('#^/students/(\d+)/certificate$#', $uri, $m) && $method === 'GET') {
        jsonResponse(getCertificate($pdo, $m[1]));
    } elseif ($uri === '/courses' && $method === 'GET') {
        jsonResponse($pdo->query('SELECT * FROM courses')->fetchAll());
    } else {
        http_response_code(404);
        jsonResponse(['error' => 'Not found', 'uri' => $uri]);
    }
} catch (Exception $e) {
    http_response_code(500);
    jsonResponse(['error' => $e->getMessage()]);
}

// --- Functions ---

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function initSchema(PDO $pdo) {
    static $initialized = false;
    if ($initialized) return;
    $initialized = true;

    $pdo->exec(file_get_contents(__DIR__ . '/../database/migrations/001_create_tables.sql'));

    try {
        $count = (int)$pdo->query('SELECT COUNT(*) FROM students')->fetchColumn();
        if ($count === 0) seedDemo($pdo, false);
    } catch (PDOException $e) {
        // tables just created, seed now
        seedDemo($pdo, false);
    }
}

function seedDemo(PDO $pdo, $reset) {
    if ($reset) {
        $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
        foreach (['attendances','progress','payments','schedules','students','lessons','courses','users'] as $t) {
            $pdo->exec("DELETE FROM $t WHERE is_demo=1 OR is_demo IS NULL");
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    }

    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    $users = [
        ['admin@demo-edtech.local', 'Demo Admin', 'admin', $hash],
        ['manager@demo-edtech.local', 'Менеджер Demo', 'manager', password_hash('manager123', PASSWORD_BCRYPT)],
        ['teacher@demo-edtech.local', 'Анна Преподавательная', 'teacher', password_hash('teacher123', PASSWORD_BCRYPT)],
        ['teacher2@demo-edtech.local', 'Илья Преподавательный', 'teacher', password_hash('teacher123', PASSWORD_BCRYPT)],
        ['teacher3@demo-edtech.local', 'Ольга Преподавательная', 'teacher', password_hash('teacher123', PASSWORD_BCRYPT)],
        ['teacher4@demo-edtech.local', 'Пётр Преподавательный', 'teacher', password_hash('teacher123', PASSWORD_BCRYPT)],
        ['student@demo-edtech.local', 'Студент Demo', 'student', password_hash('student123', PASSWORD_BCRYPT)],
    ];
    $stmt = $pdo->prepare('INSERT IGNORE INTO users (email,name,role,password,is_demo) VALUES (?,?,?,?,1)');
    foreach ($users as $u) $stmt->execute($u);

    $courses = [
        ['Fullstack Web Development', 'React + Node.js demo курс', 120, 89000],
        ['Python для Data Science', 'Python, Pandas, ML basics demo', 80, 65000],
        ['DevOps Fundamentals', 'Docker, CI/CD demo курс', 60, 55000],
        ['UI/UX Engineering', 'Design systems demo курс', 40, 45000],
    ];
    $cstmt = $pdo->prepare('INSERT IGNORE INTO courses (name,description,duration_hours,price,is_demo) VALUES (?,?,?,?,1)');
    foreach ($courses as $c) $cstmt->execute($c);

    $courseIds = $pdo->query('SELECT id FROM courses')->fetchAll(PDO::FETCH_COLUMN);
    $teacherIds = $pdo->query("SELECT id FROM users WHERE role='teacher'")->fetchAll(PDO::FETCH_COLUMN);

    $lessonTitles = ['Введение','Основы','Практика 1','Практика 2','Модуль A','Модуль B','Финальный проект'];
    $lstmt = $pdo->prepare('INSERT IGNORE INTO lessons (course_id,title,`order`,duration_minutes,is_demo) VALUES (?,?,?,60,1)');
    foreach ($courseIds as $cid) {
        foreach ($lessonTitles as $i => $title) {
            $lstmt->execute([$cid, "$title (Demo)", $i + 1]);
        }
    }

    $firstNames = ['Анна','Илья','Мария','Дмитрий','Елена','Игорь','София','Артём','Виктория','Никита','Полина','Кирилл','Алина','Максим','Дарья','Роман','Юлия','Тимур','Ксения','Влад','Олег','Наталья','Сергей','Александр'];
    $groups = ['Группа Alpha','Группа Beta','Группа Gamma','Группа Delta','Группа Epsilon','Группа Zeta','Группа Eta','Группа Theta'];
    $sstmt = $pdo->prepare('INSERT INTO students (name,email,phone,course_id,group_name,manager_comment,is_demo,enrolled_at) VALUES (?,?,?,?,?,?,1,NOW())');
    for ($i = 0; $i < 24; $i++) {
        $sstmt->execute([
            $firstNames[$i] . ' Демонстрационная',
            "student" . ($i+1) . "@example.local",
            '+7 (900) ' . str_pad($i, 3, '0', STR_PAD_LEFT) . '-00-00',
            $courseIds[$i % count($courseIds)],
            $groups[$i % count($groups)],
            $i % 4 === 0 ? 'Demo-комментарий менеджера: активный студент.' : null,
        ]);
    }

    $studentIds = $pdo->query('SELECT id FROM students')->fetchAll(PDO::FETCH_COLUMN);
    $pstmt = $pdo->prepare('INSERT INTO payments (student_id,amount,due_date,status,paid_at,description,is_demo) VALUES (?,?,?,?,?,?,1)');
    $statuses = ['paid','paid','pending','overdue','paid','pending'];
    foreach ($studentIds as $i => $sid) {
        $status = $statuses[$i % count($statuses)];
        $pstmt->execute([$sid, rand(45000,89000), date('Y-m-d', strtotime('+30 days')), $status, $status === 'paid' ? date('Y-m-d H:i:s') : null, 'Demo оплата курса']);
    }

    $schstmt = $pdo->prepare('INSERT INTO schedules (title,teacher_id,group_name,room,starts_at,ends_at,course_id,is_demo) VALUES (?,?,?,?,?,?,?,1)');
    for ($d = 0; $d < 30; $d++) {
        if ($d % 2 === 0) continue;
        $day = date('Y-m-d', strtotime("+$d days"));
        $schstmt->execute([
            'Demo занятие #' . ($d + 1),
            $teacherIds[$d % count($teacherIds)],
            $groups[$d % count($groups)],
            'Каб. ' . (100 + $d % 20),
            "$day 10:00:00",
            "$day 12:00:00",
            $courseIds[$d % count($courseIds)],
        ]);
    }

    $progstmt = $pdo->prepare('INSERT IGNORE INTO progress (student_id,lesson_id,completed,completed_at,is_demo) VALUES (?,?,?,?,1)');
    $lessons = $pdo->query('SELECT id, course_id FROM lessons')->fetchAll();
    foreach ($studentIds as $si => $sid) {
        $studentCourse = $pdo->query("SELECT course_id FROM students WHERE id=$sid")->fetchColumn();
        $courseLessons = array_filter($lessons, fn($l) => $l['course_id'] == $studentCourse);
        $completedCount = ($si % 5 === 0) ? count($courseLessons) : rand(1, max(1, count($courseLessons) - 1));
        foreach (array_slice(array_values($courseLessons), 0, $completedCount) as $l) {
            $progstmt->execute([$sid, $l['id'], 1, date('Y-m-d H:i:s')]);
        }
    }
}

function handleLogin(PDO $pdo, array $body) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$body['email'] ?? '']);
    $user = $stmt->fetch();
    if (!$user || !password_verify($body['password'] ?? '', $user['password'])) {
        http_response_code(401);
        jsonResponse(['message' => 'Неверный email или пароль']);
    }
    $token = base64_encode($user['id'] . ':' . bin2hex(random_bytes(16)));
    $pdo->prepare('INSERT INTO tokens (token,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)')->execute([$token, $user['id']]);
    unset($user['password']);
    jsonResponse(['user' => $user, 'token' => $token]);
}

function requireAuth(PDO $pdo) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $auth, $m)) { http_response_code(401); jsonResponse(['message' => 'Unauthorized']); }
    $stmt = $pdo->prepare('SELECT user_id FROM tokens WHERE token = ?');
    $stmt->execute([$m[1]]);
    $uid = $stmt->fetchColumn();
    if (!$uid) { http_response_code(401); jsonResponse(['message' => 'Invalid token']); }
    $GLOBALS['userId'] = $uid;
}

function getUser(PDO $pdo, $id) {
    $stmt = $pdo->prepare('SELECT id,name,email,role FROM users WHERE id=?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getDashboard(PDO $pdo) {
    return [
        'students_count' => $pdo->query('SELECT COUNT(*) FROM students')->fetchColumn(),
        'active_groups' => $pdo->query('SELECT COUNT(DISTINCT group_name) FROM students')->fetchColumn(),
        'payments_month' => $pdo->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid'")->fetchColumn(),
        'overdue_count' => $pdo->query("SELECT COUNT(*) FROM payments WHERE status='overdue'")->fetchColumn(),
        'upcoming_schedules' => $pdo->query("SELECT s.*, u.name as teacher_name FROM schedules s JOIN users u ON u.id=s.teacher_id WHERE starts_at >= NOW() ORDER BY starts_at LIMIT 5")->fetchAll(),
    ];
}

function getStudents(PDO $pdo, array $params) {
    $sql = 'SELECT s.*, c.name as course_name FROM students s LEFT JOIN courses c ON c.id=s.course_id WHERE 1=1';
    $bind = [];
    if (!empty($params['search'])) { $sql .= ' AND (s.name LIKE ? OR s.email LIKE ?)'; $bind[] = "%{$params['search']}%"; $bind[] = "%{$params['search']}%"; }
    if (!empty($params['course_id'])) { $sql .= ' AND s.course_id=?'; $bind[] = $params['course_id']; }
    $sql .= ' ORDER BY s.created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($bind);
    $data = $stmt->fetchAll();
    return ['data' => $data, 'total' => count($data)];
}

function getStudent(PDO $pdo, $id) {
    $stmt = $pdo->prepare('SELECT s.*, c.name as course_name FROM students s LEFT JOIN courses c ON c.id=s.course_id WHERE s.id=?');
    $stmt->execute([$id]);
    $student = $stmt->fetch();
    if (!$student) { http_response_code(404); jsonResponse(['error' => 'Not found']); }
    $pstmt = $pdo->prepare('SELECT * FROM payments WHERE student_id=? ORDER BY due_date DESC');
    $pstmt->execute([$id]);
    $student['payments'] = $pstmt->fetchAll();
    $lstmt = $pdo->prepare('SELECT l.*, COALESCE(p.completed,0) as completed FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.id AND p.student_id=? WHERE l.course_id=? ORDER BY l.`order`');
    $lstmt->execute([$id, $student['course_id']]);
    $lessons = $lstmt->fetchAll();
    $student['lessons'] = $lessons;
    $total = count($lessons);
    $done = count(array_filter($lessons, fn($l) => $l['completed']));
    $student['completion_percent'] = $total ? round($done / $total * 100, 1) : 0;
    return $student;
}

function createStudent(PDO $pdo, array $body) {
    $stmt = $pdo->prepare('INSERT INTO students (name,email,phone,course_id,group_name,is_demo,enrolled_at) VALUES (?,?,?,?,?,1,NOW())');
    $stmt->execute([$body['name'], $body['email'], $body['phone'] ?? null, $body['course_id'], $body['group_name'] ?? 'Группа Demo']);
    return ['id' => $pdo->lastInsertId(), ...$body];
}

function getSchedules(PDO $pdo, array $params) {
    $sql = 'SELECT s.*, u.name as teacher_name, c.name as course_name FROM schedules s JOIN users u ON u.id=s.teacher_id LEFT JOIN courses c ON c.id=s.course_id WHERE 1=1';
    if (!empty($params['from'])) $sql .= " AND starts_at >= '{$params['from']}'";
    if (!empty($params['to'])) $sql .= " AND starts_at <= '{$params['to']}'";
    $sql .= ' ORDER BY starts_at';
    return $pdo->query($sql)->fetchAll();
}

function createSchedule(PDO $pdo, array $body) {
    $stmt = $pdo->prepare('INSERT INTO schedules (title,teacher_id,group_name,room,starts_at,ends_at,course_id,is_demo) VALUES (?,?,?,?,?,?,?,1)');
    $stmt->execute([$body['title'], $body['teacher_id'], $body['group_name'], $body['room'], $body['starts_at'], $body['ends_at'], $body['course_id'] ?? null]);
    return ['id' => $pdo->lastInsertId()];
}

function getPayments(PDO $pdo, array $params) {
    $sql = 'SELECT p.*, s.name as student_name FROM payments p JOIN students s ON s.id=p.student_id WHERE 1=1';
    if (!empty($params['status'])) $sql .= " AND p.status='{$params['status']}'";
    $sql .= ' ORDER BY p.due_date DESC';
    return ['data' => $pdo->query($sql)->fetchAll()];
}

function createPayment(PDO $pdo, array $body) {
    $stmt = $pdo->prepare('INSERT INTO payments (student_id,amount,due_date,status,description,is_demo) VALUES (?,?,?,?,?,1)');
    $stmt->execute([$body['student_id'], $body['amount'], $body['due_date'], 'pending', $body['description'] ?? 'Demo счёт']);
    return ['id' => $pdo->lastInsertId()];
}

function updatePayment(PDO $pdo, $id, array $body) {
    $paid = ($body['status'] ?? '') === 'paid' ? date('Y-m-d H:i:s') : null;
    $pdo->prepare('UPDATE payments SET status=?, paid_at=COALESCE(?,paid_at) WHERE id=?')->execute([$body['status'], $paid, $id]);
    return $pdo->query("SELECT * FROM payments WHERE id=$id")->fetch();
}

function getProgress(PDO $pdo, $studentId) {
    $student = getStudent($pdo, $studentId);
    return ['student' => $student, 'completion_percent' => $student['completion_percent'], 'modules' => $student['lessons'], 'certificate_available' => $student['completion_percent'] >= 100];
}

function toggleProgress(PDO $pdo, $studentId, $lessonId) {
    $existing = $pdo->query("SELECT * FROM progress WHERE student_id=$studentId AND lesson_id=$lessonId")->fetch();
    if ($existing) {
        $newVal = $existing['completed'] ? 0 : 1;
        $pdo->prepare('UPDATE progress SET completed=?, completed_at=? WHERE id=?')->execute([$newVal, $newVal ? date('Y-m-d H:i:s') : null, $existing['id']]);
    } else {
        $pdo->prepare('INSERT INTO progress (student_id,lesson_id,completed,completed_at,is_demo) VALUES (?,?,1,NOW(),1)')->execute([$studentId, $lessonId]);
    }
    return getProgress($pdo, $studentId);
}

function getCertificate(PDO $pdo, $studentId) {
    $progress = getProgress($pdo, $studentId);
    if ($progress['completion_percent'] < 100) { http_response_code(403); return ['message' => 'Сертификат доступен при 100%']; }
    return ['certificate' => ['student_name' => $progress['student']['name'], 'course_name' => $progress['student']['course_name'], 'issued_at' => date('c'), 'certificate_id' => 'DEMO-CERT-' . strtoupper(dechex($studentId))]];
}

function exportPaymentsCsv(PDO $pdo) {
    $rows = $pdo->query('SELECT p.*, s.name as student_name FROM payments p JOIN students s ON s.id=p.student_id')->fetchAll();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="payments-demo.csv"');
    echo "\xEF\xBB\xBF";
    echo "ID,Студент,Сумма,Срок,Статус,Оплачено\n";
    foreach ($rows as $r) {
        echo implode(',', [$r['id'], '"' . $r['student_name'] . '"', $r['amount'], $r['due_date'], $r['status'], $r['paid_at'] ?? '']) . "\n";
    }
    exit;
}

function exportStudentsCsv(PDO $pdo) {
    $rows = $pdo->query('SELECT s.*, c.name as course_name FROM students s LEFT JOIN courses c ON c.id=s.course_id')->fetchAll();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="students-demo.csv"');
    echo "\xEF\xBB\xBF";
    echo "ID,Имя,Email,Телефон,Курс,Группа\n";
    foreach ($rows as $r) {
        echo implode(',', [$r['id'], '"' . $r['name'] . '"', $r['email'], $r['phone'], '"' . ($r['course_name']??'') . '"', $r['group_name']??'']) . "\n";
    }
    exit;
}

function countRows(PDO $pdo, $table) {
    return (int)$pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
}
