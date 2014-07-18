<?php

function __($line) {
  $args = array_slice(func_get_args(), 1);

  return Language::line($line, null, $args);
}

function is_admin() {
  return strpos(Uri::current(), 'admin') === 0;
}

function is_installed() {
  return Config::get('db') !== null or Config::get('database') !== null;
}

function slug($str, $separator = '-') {
  $str = normalize($str);

  // replace non letter or digits by separator
  $str = preg_replace('#^[^A-z0-9]+$#', $separator, $str);

  return trim(strtolower($str), $separator);
}

// JML 20140715 was: ... = true
function parse($str, $markdown = false) {
  /* JML 20140717 commented out the tags matching section: 
  // process tags
  $pattern = '/[\{\{]{1}([a-z]+)[\}\}]{1}/i';

  if(preg_match_all($pattern, $str, $matches)) {
    list($search, $replace) = $matches;

    foreach($replace as $index => $key) {
      $replace[$index] = Config::meta($key);
    }

    $str = str_replace($search, $replace, $str);
  } */


  //  Parse Markdown as well?
  if($markdown === true) {
    // Convert all HTML entities to their applicable characters
    // JML 20140715: don't touch the char entities
    // $str = html_entity_decode($str, ENT_NOQUOTES, System\Config::app('encoding'));

    // make HTML out of the markdown content
    $md = new Markdown;
    // JML 20140715 returns the string verbatim, was:  $str = $md->transform($str);
  }

  return $str;
}

function readable_size($size) {
  $unit = array('b','kb','mb','gb','tb','pb');

  return round($size / pow(1024, ($i = floor(log($size, 1024)))), 2) . ' ' . $unit[$i];
}
