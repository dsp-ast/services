<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name']) || !isset($input['phone'])) {
    echo json_encode(['error' => 'Не все поля заполнены']);
    exit;
}

$name = htmlspecialchars(strip_tags(trim($input['name'])));
$phone = htmlspecialchars(strip_tags(trim($input['phone'])));
$comment = isset($input['comment']) ? htmlspecialchars(strip_tags(trim($input['comment']))) : '';
$service = isset($input['service']) ? htmlspecialchars(strip_tags(trim($input['service']))) : 'Не указана';

$data = [
    'id' => time(),
    'date' => date('Y-m-d H:i:s'),
    'name' => $name,
    'phone' => $phone,
    'comment' => $comment,
    'service' => $service,
    'status' => 'Новая'
];

$filename = 'leads_' . date('Y-m') . '.json';
$leads = [];

if (file_exists($filename)) {
    $leads = json_decode(file_get_contents($filename), true) ?: [];
}

$leads[] = $data;
file_put_contents($filename, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

$to = 'admin@partner-center.ru';
$subject = 'Новая заявка с сайта';
$message = "Имя: $name\nТелефон: $phone\nУслуга: $service\nКомментарий: $comment";
$headers = 'From: site@partner-center.ru';

mail($to, $subject, $message, $headers);

echo json_encode(['success' => true, 'id' => $data['id']]);
?>