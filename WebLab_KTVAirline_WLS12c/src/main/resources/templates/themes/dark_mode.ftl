<#--
SINK: the live lab template instantiates QRCodeHelper with ?new(), so disabling
?new() in the Freemarker sandbox would break QR rendering unless the URL is
prepared before template rendering.

FIXED TEMPLATE:

Remove the two assignments below and keep the existing <img> tag that reads
${memberQrUrl?html}. ProfileViewController should put a precomputed static QR
URL into model.memberQrUrl.
-->
<#assign memberQr = "org.example.util.QRCodeHelper"?new()>
<#assign memberQrUrl = memberQr(email)>
<div class="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
  <div class="border-b border-slate-700 bg-slate-900 px-6 py-4">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold text-white">Thông tin cơ bản</h2>
    </div>
  </div>
  <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_160px]">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p class="text-sm font-medium text-slate-300">Họ và tên</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${name?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-slate-300">Email</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${email?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-slate-300">Mã định danh</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${idNumber?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-slate-300">Ngày sinh</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${birthday?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-slate-300">Số điện thoại</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${phoneNum?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-slate-300">Giới tính</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${gender?html}</p>
      </div>
      <div class="md:col-span-2">
        <p class="text-sm font-medium text-slate-300">Địa chỉ</p>
        <p class="mt-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-50">${address?html}</p>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center rounded-xl border border-cyan-400/20 bg-slate-700 p-4">
      <img src="${memberQrUrl?html}" alt="Member QR" class="h-32 w-32 rounded-lg bg-white p-2 shadow-sm" />
      <p class="mt-3 text-center text-xs font-medium text-cyan-100">Mã thành viên</p>
    </div>
  </div>
</div>
