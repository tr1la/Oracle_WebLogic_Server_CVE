from java.io import FileInputStream
from java.util import Properties

properties = Properties()
stream = FileInputStream('/u01/oracle/properties/domain.properties')
try:
    properties.load(stream)
finally:
    stream.close()

connect(
    properties.getProperty('username'),
    properties.getProperty('password'),
    't3://127.0.0.1:7001'
)
edit()
startEdit()
cd('/Servers/Server-0')
cmo.setListenAddress('server0')
save()
activate(block='true')
disconnect()
exit()
