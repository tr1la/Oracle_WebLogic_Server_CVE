from java.io import FileInputStream
from java.util import Properties

credentials = Properties()
credentials.load(FileInputStream('/u01/oracle/properties/domain.properties'))

connect(
    credentials.getProperty('username'),
    credentials.getProperty('password'),
    't3://127.0.0.1:7001'
)

edit()
startEdit()
cd('/Servers/Server-0')
cmo.setListenPort(7003)
save()
activate()

disconnect()
exit()
