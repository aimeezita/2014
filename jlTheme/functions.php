<?php

/*
  Custom theme functions
  Note: we recommend you prefix all your functions to avoid any naming
  collisions or wrap your functions with if function_exists braces.
*/

function mytheme_article_content() {
// from: https://github.com/anchorcms/anchor-cms/issues/306
    // if you just want the raw content you saved
    return Registry::prop('article', 'html');

    // if you want the content to be parsed with markdown
    // $md = new Markdown;
    // return $md->transform(Registry::prop('article', 'html'));

    // if you want to encode any html in you posts
    // return htmlentities(Registry::prop('article', 'html'), ENT_NOQUOTES, Config::app('encoding'));
}

function numeral($number) {
  $test = abs($number) % 10;
  $ext = ((abs($number) % 100 < 21 and abs($number) % 100 > 4) ? 'th' : (($test < 4) ? ($test < 3) ? ($test < 2) ? ($test < 1) ? 'th' : 'st' : 'nd' : 'rd' : 'th'));
  return $number . $ext;
}

function count_words($str) {
  return count(preg_split('/\s+/', strip_tags($str), null, PREG_SPLIT_NO_EMPTY));
}

function pluralise($amount, $str, $alt = '') {
  return intval($amount) === 1 ? $str : $str . ($alt !== '' ? $alt : 's');
}

function relative_time($date) {
  if(is_numeric($date)) $date = '@' . $date;

  $user_timezone = new DateTimeZone(Config::app('timezone'));
  $date = new DateTime($date, $user_timezone);

  // get current date in user timezone
  $now = new DateTime('now', $user_timezone);

  $elapsed = $now->format('U') - $date->format('U');

  if($elapsed <= 1) {
    return 'Just now';
  }

  $times = array(
    31104000 => 'year',
    2592000 => 'month',
    604800 => 'week',
    86400 => 'day',
    3600 => 'hour',
    60 => 'minute',
    1 => 'second'
  );

  foreach($times as $seconds => $title) {
    $rounded = $elapsed / $seconds;

    if($rounded > 1) {
      $rounded = round($rounded);
      return $rounded . ' ' . pluralise($rounded, $title) . ' ago';
    }
  }
}

function twitter_account() {
  return site_meta('twitter', 'idiot');
}

function twitter_url() {
  return 'https://twitter.com/' . twitter_account();
}

function total_articles() {
  return Post::where(Base::table('posts.status'), '=', 'published')->count();
}
