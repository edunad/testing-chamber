# testing-chamber

### What is it?
It's deployment tool made for web applications integrated with jenkins. Allowing users to deploy new versions while browsing the deployed website.<br>
It comes with some example batch scripts for IIS deployment :) and some sweet animations! (Thanks https://github.com/airbnb/lottie-web)<br>
### How to build it
<table>
    <tbody>
        <tr>
        <td>
            <b>Installation from source</b>
        </td>
        <td></td>
        </tr>
        <tr>
        <td></td>
        <td>
            1. Install NodeJS<br>
            2. Navigate to client and perform a <code>npm install</code><br>
            3. Navigate to server and perform a <code>npm install</code><br>
            4. Open a console on client and execute <code>npm start</code><br>
            5. Open a console on server with admin permissions and execute <code>npm start</code><br>
            6. Done! Navigate to <code>http://localhost:9900</code><br>
        </td>
        </tr>
        <tr>
        <td>
            <b>Installation from releases</b>
        </td>
        <td>
          TODO
        </td>
        </tr>
        <tr>
        <td>
        </td>
        <td>
        </td>
        </tr>
        <tr>
        <td>
            <b>Configuration</b>
        </td>
        <td>
          <b>General Configuration</b><br>
          To configure the application open the <code>config.json</code> on the server folder<br><br>
          <b>Authentication Configuration</b><br>
          It is recommended to change the <code>SOCKET_IO_AUTHTOKEN</code> to something else, it will not fully prevent different apps  from connecting. It's a very <b>BASIC</b> authentication. You will need to update the <code>client_config.json</code> on the client folder with the new key as well.
        </td>
        </tr>
    </tbody>
</table>

## Some cool pics
### Some animations
![](https://i.imgur.com/ryGrpkz.gif)
![](https://i.imgur.com/Lwg4q1q.gif)

### Loading Screen
![](https://i.imgur.com/oUsMREu.png)
### Changelog Menu
![](https://i.imgur.com/U4jIOs0.png)
![](https://i.imgur.com/OWZQyDs.png)
### Deployment Menu
![](https://i.imgur.com/E8WHoLA.png)
