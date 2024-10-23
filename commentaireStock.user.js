// ==UserScript==
// @name         Commentaire Stock
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add comments to stock on dc.kfplc.com using KVDB.io
// @author
// @match        https://dc.kfplc.com/*
// @grant        GM_xmlhttpRequest
// @connect      kvdb.io
// ==/UserScript==

(function() {
    'use strict';

    // Wait for the DOM to be fully loaded
    window.addEventListener('load', function() {
        console.log('Commentaire Stock script started.');

        // Define the KVDB bucket URL
        var KVDB_BUCKET_URL = 'https://kvdb.io/NEM1vLMA4ZKb56k2GLBEks/'; // Your provided bucket URL
        console.log('KVDB_BUCKET_URL set to:', KVDB_BUCKET_URL);

        // Function to create the Commentaire Stock button and insert it into the page
        function createCommentButton() {
            // Check if the button already exists
            if (document.querySelector('[data-auto="commentaire-stock-button"]')) {
                console.log('Commentaire stock button already exists.');
                return;
            }

            // Find the quantities table
            var quantitiesTable = document.querySelector('[data-auto="quantities-data-table"]');
            if (quantitiesTable) {
                console.log('Quantities table found.');
                // Find the parent element that contains the grid
                var parentElement = quantitiesTable.parentElement;
                // Find the grid after the quantities table
                var grids = parentElement.querySelectorAll('.grid.grid--resp');
                if (grids && grids.length > 0) {
                    console.log('Grids found. Inserting Commentaire stock button.');
                    // Use the first grid or find the appropriate one
                    var grid = grids[0];

                    // Create a new grid__item
                    var gridItem = document.createElement('div');
                    gridItem.className = 'grid__item';

                    // Create the nav-list and li
                    var navList = document.createElement('ul');
                    navList.className = 'nav-list';
                    navList.setAttribute('data-auto', 'commentaire-stock-button'); // Add data attribute to identify

                    var li = document.createElement('li');

                    // Create the link
                    var link = document.createElement('a');
                    link.href = '#';
                    link.className = 'nav-list__link';

                    // Create the left icon (same as "Détails du fournisseur")
                    var leftIcon = document.createElement('i');
                    leftIcon.setAttribute('data-auto', 'vc-icon');
                    leftIcon.className = 'm-pull-icon icon icon--orders icon--brand';

                    // Create the text node
                    var linkText = document.createTextNode(' Commentaire stock ');

                    // Create the right icon
                    var rightIcon = document.createElement('i');
                    rightIcon.setAttribute('data-auto', 'vc-icon');
                    rightIcon.className = 'nav-list__icon icon icon--arrow icon--brand';

                    // Append the left icon, text, and right icon to the link
                    link.appendChild(leftIcon);
                    link.appendChild(linkText);
                    link.appendChild(rightIcon);


                    // Append elements
                    li.appendChild(link);
                    navList.appendChild(li);
                    gridItem.appendChild(navList);

                    // Insert the gridItem at the beginning of the grid
                    grid.insertBefore(gridItem, grid.firstElementChild);
                    console.log('Commentaire stock button inserted into the grid.');

                    // Add click event listener to the link
                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        console.log('Commentaire Stock button clicked.');
                        try {
                            var ean = getEANFromURL();
                            console.log('EAN obtained from URL:', ean);
                            if (!ean) {
                                alert('EAN introuvable dans l\'URL');
                                console.error('EAN not found in URL.');
                                return;
                            }
                            var comment = prompt('Entrez votre commentaire pour EAN ' + ean + ':');
                            console.log('Comment entered:', comment);
                            if (comment !== null && comment.trim() !== '') {
                                saveComment(ean, comment, function(){
                                    alert('Commentaire enregistré :\n\n"' + comment + '"');
                                    console.log('Comment saved for EAN:', ean);
                                    addCommentButton(comment);
                                });
                            } else {
                                console.log('No comment entered or comment is empty.');
                            }
                        } catch (error) {
                            console.error('Error in button click handler:', error);
                        }
                    });
                } else {
                    console.error('Grid not found after quantities table.');
                }
            } else {
                console.error('Quantities table not found.');
            }
        }

        // Function to get EAN from URL
        function getEANFromURL() {
            var url = window.location.href;
            console.log('Current URL:', url);
            var match = url.match(/\/product-query\/(\d+)/);
            if (match) {
                console.log('EAN found in URL:', match[1]);
                return match[1];
            } else {
                console.warn('EAN not found in URL.');
                return null;
            }
        }

        // Function to save comment to KVDB.io
        function saveComment(ean, comment, callback) {
            console.log('Saving comment for EAN:', ean);
            GM_xmlhttpRequest({
                method: 'POST', // Changed from PUT to POST
                url: KVDB_BUCKET_URL + encodeURIComponent(ean), // Ensure EAN is URL-encoded
                data: comment,
                headers: {
                    'Content-Type': 'text/plain'
                },
                onload: function(response) {
                    console.log('Save comment response:', response.status, response.responseText);
                    if (response.status === 200 || response.status === 201) {
                        if (callback) callback();
                    } else {
                        console.error('Failed to save comment. Status:', response.status);
                        alert('Failed to save comment. Please try again.');
                    }
                },
                onerror: function(response) {
                    console.error('Error saving comment for EAN:', ean, response);
                    alert('Error saving comment: ' + response.statusText);
                }
            });
        }

        // Function to get comment from KVDB.io
        function getComment(ean, callback) {
            console.log('Fetching comment for EAN:', ean);
            GM_xmlhttpRequest({
                method: 'GET',
                url: KVDB_BUCKET_URL + encodeURIComponent(ean),
                onload: function(response) {
                    console.log('Get comment response:', response.status, response.responseText);
                    if (response.status === 200) {
                        console.log('Comment retrieved:', response.responseText);
                        callback(response.responseText); // Pass only the comment text
                    } else if (response.status === 404) {
                        console.warn('No comment found for EAN:', ean);
                        callback(null);
                    } else {
                        console.error('Error fetching comment. Status:', response.status);
                        alert('Error fetching comment. Please try again.');
                        callback(null);
                    }
                },
                onerror: function(response) {
                    console.error('Error fetching comment for EAN:', ean, response);
                    alert('Error fetching comment: ' + response.statusText);
                    callback(null);
                }
            });
        }

        // Function to delete comment from KVDB.io
        function deleteComment(ean, callback) {
            console.log('Deleting comment for EAN:', ean);
            GM_xmlhttpRequest({
                method: 'PUT',
                url: KVDB_BUCKET_URL + encodeURIComponent(ean),
                data: '', // Empty string to delete the key
                headers: {
                    'Content-Type': 'text/plain'
                },
                onload: function(response) {
                    console.log('Delete comment response:', response.status, response.responseText);
                    if (response.status === 200 || response.status === 201) {
                        if (callback) callback();
                    } else {
                        console.error('Failed to delete comment. Status:', response.status);
                        alert('Failed to delete comment. Please try again.');
                    }
                },
                onerror: function(response) {
                    console.error('Error deleting comment for EAN:', ean, response);
                    alert('Error deleting comment: ' + response.statusText);
                }
            });
        }

        // Function to add comment button to stock display
        function addCommentButton(comment) {
                console.log('Adding comment button to stock display.');
                // Find the row where location is "Total"
                var rows = document.querySelectorAll('tr[data-auto="vc-datatable-row"]');
                console.log('Found', rows.length, 'rows.');
                rows.forEach(function(row) {
                    var locationCell = row.querySelector('td[data-label="productQuery.headings.location"] span');
                    if (locationCell && locationCell.textContent.trim().includes('Total')) {
                        console.log('Found Total row.');
                        var qtyCell = row.querySelector('td[data-label="productQuery.headings.qtyEach"]');
                        if (qtyCell && !qtyCell.querySelector('.comment-button')) {
                            console.log('Adding comment button to qtyCell.');
                            // Create the comment button
                            var commentBtn = document.createElement('button');
                            commentBtn.innerText = 'Voir commentaire';
                            commentBtn.className = 'comment-button';
                            commentBtn.style.marginRight = '5px';
                            commentBtn.style.fontSize = '12px';
                            commentBtn.style.backgroundColor = 'red';
                            commentBtn.style.color = 'white';
                            commentBtn.style.border = '1px solid red';
                            commentBtn.style.cursor = 'pointer';

                            commentBtn.addEventListener('click', function() {
                                console.log('Comment button clicked.');
                                var action = confirm('Commentaire enregistré :\n\n"' + comment + '"\n\nVoulez-vous supprimer ce commentaire ?');
                                if (action) {
                                    console.log('User confirmed deletion of comment.');
                                    deleteComment(getEANFromURL(), function(){
                                        alert('Commentaire supprimé.');
                                        console.log('Comment deleted for EAN:', getEANFromURL());
                                        // Remove the comment button
                                        commentBtn.parentNode.removeChild(commentBtn);
                                        console.log('Comment button removed.');
                                    });
                                } else {
                                    console.log('User canceled deletion of comment.');
                                }
                            });

                            // Insert the button before the stock value
                            var qtyCellContent = qtyCell.querySelector('span');
                            if (qtyCellContent) {
                                qtyCell.insertBefore(commentBtn, qtyCellContent);
                                console.log('Comment button inserted before stock value.');
                            } else {
                                // If qtyCellContent not found, append at beginning
                                qtyCell.insertBefore(commentBtn, qtyCell.firstChild);
                                console.log('Comment button inserted at beginning of qtyCell.');
                            }
                        } else {
                            console.log('Comment button already exists in qtyCell or qtyCell not found.');
                        }
                    }
                });
            }

            // Observe DOM changes to detect when the stock table is loaded
            function observeStockTable() {
                console.log('Starting to observe stock table for changes.');
                var targetNode = document.querySelector('[data-auto="product-query-tabs"]') || document.body;
                var observerOptions = {
                    childList: true,
                    subtree: true
                };

                var timeout;
                var observer = new MutationObserver(function(mutations) {
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        console.log('Processing mutations:', mutations);
                        var currentEAN = getEANFromURL();
                        console.log('Current EAN:', currentEAN);
                        if (currentEAN) {
                            getComment(currentEAN, function(comment){
                                if (comment && comment.trim() !== '') {
                                    addCommentButton(comment);
                                } else {
                                    console.log('No comment to add for current EAN.');
                                }
                            });
                        } else {
                            console.warn('No EAN found during mutation.');
                        }

                        // Try to create the Commentaire Stock button
                        createCommentButton();

                    }, 300); // Adjust the debounce delay as needed
                });

                observer.observe(targetNode, observerOptions);
                console.log('Mutation observer set up.');
            }

            // Start observing when the script loads
            observeStockTable();
            console.log('Script initialization complete.');

            // Create the Commentaire Stock button
            createCommentButton();
        });
    })();
