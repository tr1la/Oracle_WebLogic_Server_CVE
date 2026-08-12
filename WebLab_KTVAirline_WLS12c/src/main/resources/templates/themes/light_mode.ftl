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
<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
    </div>
  </div>
  <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_160px]">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p class="text-sm font-medium text-gray-500">Họ và tên</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${name?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">Email</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${email?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">Mã định danh</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${idNumber?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">Ngày sinh</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${birthday?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">Số điện thoại</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${phoneNum?html}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">Giới tính</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${gender?html}</p>
      </div>
      <div class="md:col-span-2">
        <p class="text-sm font-medium text-gray-500">Địa chỉ</p>
        <p class="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">${address?html}</p>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <img src="${memberQrUrl?html}" alt="Member QR" class="h-32 w-32 rounded-lg bg-white p-2 shadow-sm" />
      <p class="mt-3 text-center text-xs font-medium text-indigo-800">Mã thành viên</p>
    </div>
  </div>
</div>
