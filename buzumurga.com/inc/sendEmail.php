<?php
/**
 * Contact form handler for buzumurga.com.
 *
 * Answers JSON to fetch() requests and redirects back to the page
 * for plain form posts (when JavaScript is disabled).
 */

// Where messages are delivered
$siteOwnersEmail = 'buzumurga.m@gmail.com';
// Sender address on your own domain - improves deliverability (SPF/DMARC)
$fromEmail = 'noreply@buzumurga.com';

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond($ok, $error, $wantsJson, $code = 200)
{
    if ($wantsJson) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('ok' => $ok, 'error' => $error));
    } else {
        header('Location: /?sent=' . ($ok ? '1' : '0') . '#contact', true, 303);
    }
    exit;
}

function field($name, $max)
{
    $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

function oneLine($value)
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $value));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed.', $wantsJson, 405);
}

// bots fill the hidden field - pretend everything is fine
if (field('website', 200) !== '') {
    respond(true, null, $wantsJson);
}

$name = oneLine(field('contactName', 100));
$email = oneLine(field('contactEmail', 200));
$subject = oneLine(field('contactSubject', 200));
$message = field('contactMessage', 5000);

$errors = array();
if (strlen($name) < 2) {
    $errors[] = 'Please enter your name.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
if (strlen($message) < 15) {
    $errors[] = 'Please enter a message of at least 15 characters.';
}
if ($errors) {
    respond(false, implode(' ', $errors), $wantsJson, 422);
}

if ($subject === '') {
    $subject = 'Message from buzumurga.com';
}

$body = "Name: $name\n"
    . "Email: $email\n"
    . "IP: " . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '-') . "\n\n"
    . $message . "\n\n"
    . "-----\nSent from the contact form on buzumurga.com\n";

$encodedName = '=?UTF-8?B?' . base64_encode($name) . '?=';
$headers = "From: buzumurga.com <$fromEmail>\r\n"
    . "Reply-To: $encodedName <$email>\r\n"
    . "MIME-Version: 1.0\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

if (mail($siteOwnersEmail, $encodedSubject, $body, $headers)) {
    respond(true, null, $wantsJson);
}

respond(false, 'The message could not be sent. Please email me directly at ' . $siteOwnersEmail . '.', $wantsJson, 500);
