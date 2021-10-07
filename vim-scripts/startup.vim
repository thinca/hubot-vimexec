let s:dir = expand('<sfile>:h')
let s:group = $VIMEXEC_GROUP
call setenv('VIMEXEC_GROUP', v:null)
let s:request_file = printf('%s/request-%s', s:dir, s:group)

function s:on_out(cxt, ch, msg) abort
  let a:cxt.messages += [a:msg]
endfunction

function s:on_exit(cxt, ch, status) abort
  try
    call s:write_result(join(a:cxt.messages, ''))
  finally
    call s:wait_request()
  endtry
endfunction

function s:write_result(message) abort
  let [result_filename; lines] = split(a:message, "\n", 1)
  let result_file = s:dir . '/' . result_filename
  if !filewritable(result_file)
    return
  endif
  let script_file = tempname()
  call writefile(lines, script_file)
  silent! let result = execute('source ' . script_file)
  if filereadable(script_file)
    call delete(script_file)
  endif
  call writefile(split(result, "\n", 1), result_file)
endfunction

function s:wait_request() abort
  let cxt = {
  \   'messages': [],
  \ }
  let job = job_start(['cat', s:request_file], {
  \   'out_mode': 'raw',
  \   'out_cb': funcref('s:on_out', [cxt]),
  \   'exit_cb': funcref('s:on_exit', [cxt]),
  \ })
endfunction

call s:wait_request()
