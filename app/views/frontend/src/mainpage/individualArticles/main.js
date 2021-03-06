import React, { useState, Component, useEffect } from "react";
import { ArticleHeading, SubHeading, Result, UserTable, ArticleSelect, DateSelect, DateButton, ErrorHeading, ErrorSubHeading } from "./styled";
import Select from '@atlaskit/select';
import Button from '@atlaskit/button';
import Modal, { ModalTransition } from '@atlaskit/modal-dialog';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { IndividualArticlesCharts } from "./charts/main";
import { RedditArticles } from "./reddit/main"

export const IndividualArticles = props => {
  const [allArticles, setAllArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState([]);
  const [currentArticleTitle, setCurrentArticleTitle] = useState("");
  const [currentRevisions, setCurrentRevisions] = useState([]);
  const [topFiveUsers, setTopFiveUsers] = useState([]);
  const [latestRevisionTimeDifference, setLatestRevisionTimeDifference] = useState([]);
  const [numberOfRevisionsPulled, setNumberOfRevisionsPulled] = useState([]);
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [validatedFromYear, setValidatedFromYear] = useState("1800");
  const [validatedToYear, setValidatedToYear] = useState("2020");
  const [isOpen, setIsOpen] = useState(false);
  const [yearOptions, setYearOptions] = useState([]);

  // Retrieve list from Express App
  useEffect(() => {
    //fetch('/api/individual/getAllArticles').then(res => res.json()).then(list => setAllArticles(list));
  }, [])

  useEffect(() => {
    // GET request
    if (currentArticleTitle != "") {
      fetch('/api/individual/getTopFiveUsers/' + currentArticleTitle + '/' + validatedFromYear + '/' + validatedToYear).then(res => res.json()).then(list => setTopFiveUsers(list));
      fetch('/api/individual/getNumberOfRevisions/' + currentArticleTitle + '/' + validatedFromYear + '/' + validatedToYear)
      .then(res => res.json()).then(list => 
        {
          setCurrentRevisions(list[0].count)
        })
    }
  }, [currentArticleTitle, validatedFromYear, validatedToYear])

  useEffect(() => {
    fetch('/api/individual/getAllArticles').then(res => res.json()).then(list => setAllArticles(list));

    if (currentArticleTitle != "") {
      fetch('/api/individual/getMinYear/' + currentArticleTitle).then(res => res.json())
        .then(list => {
          var min = new Date(list[0].timestamp);
          fetch('/api/individual/getMaxYear/' + currentArticleTitle).then(res => res.json())
            .then(list => {
              var max = new Date(list[0].timestamp);
              var temp = []
              for (var i = min.getFullYear(); i <= max.getFullYear(); i++) {
                temp.push({ label: i, value: i });
              }
              setYearOptions(temp);
            });
        });
    }
  }, [currentArticleTitle])

  const setYearRange = () => {
    // some year validation

    if (fromYear > toYear || fromYear == "" || toYear == "") {
      setIsOpen(true);
    } else {
      setValidatedFromYear(fromYear);
      setValidatedToYear(toYear);
    }
  }

  const allArticlesOptions = allArticles.map(article => ({
    label: "Title: " + article._id.title + " " + "Number of Revisions: " + article.count,
    value: article
  }))

  const articleSelected = (value) => {
    setCurrentArticleTitle(value._id.title);
    setCurrentArticle(value);
    setCurrentRevisions(value.count);
    fetch('/api/individual/getLatestRevision/' + value._id.title).then(res => res.json())
      .then(list => {
          setLatestRevisionTimeDifference(list.timeDifference);
          setNumberOfRevisionsPulled(list.result);
      });
  }

  var num = 0;

  var topFiveUsersTable = topFiveUsers.map(user => {
    num = num + 1;
    return (
      <TableBody>
        <TableRow>
          <TableCell align="right">{num}</TableCell>
          <TableCell align="right">{user._id.user}</TableCell>
          <TableCell align="right">{user.userCount}</TableCell>
        </TableRow>
      </TableBody>
    )
  })
  return (
    <div>
      <ArticleHeading>Individual Articles</ArticleHeading>
      <ArticleSelect>
        <Select
          onChange={e => articleSelected(e.value)}
          options={allArticlesOptions}
          placeholder="Select an article...">
        </Select>

      </ArticleSelect>


      {currentArticle != ""
        ? <div>
          <SubHeading>Summary Information - <i>{currentArticleTitle}</i> </SubHeading>
          <DateSelect>
            <Select
              onChange={e => setFromYear(e.value)}
              options={yearOptions}
              placeholder="From: ">
            </Select>

            <br></br>

            <Select
              onChange={e => setToYear(e.value)}
              options={yearOptions}
              placeholder="To: ">
            </Select>
          </DateSelect>

          <DateButton><Button onClick={setYearRange}>Update Analytics for {currentArticleTitle}</Button></DateButton>

          <Result>
          <a>The last update was {latestRevisionTimeDifference} days ago.</a><br></br>

          {latestRevisionTimeDifference > 1 
        ? <div><a>Pulling data from Media Wiki</a><br/>
        <a>{numberOfRevisionsPulled} revisions has been added.</a><br/>
          </div> : <a>Database is up-to-date</a> }
          
            <a><b>Total Number of Revisions:</b> {currentRevisions}</a>
            <br></br>
            <a><b>Top 5 Regular Users:</b></a>

            <UserTable>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell align="right"><b>Rank</b></TableCell>
                    <TableCell align="right"><b>User</b></TableCell>
                    <TableCell align="right"><b>Revision Count</b></TableCell>
                  </TableRow>
                </TableHead>
                {topFiveUsersTable}

              </Table>
            </UserTable>

            <br></br>
            <a><b>News:</b></a>
            <RedditArticles currentArticleTitle={currentArticleTitle}></RedditArticles>

          </Result>

          <IndividualArticlesCharts currentArticleTitle={currentArticleTitle} fromYear={validatedFromYear} toYear={validatedToYear} topFiveUsers={topFiveUsers}></IndividualArticlesCharts>
        </div>

        : <div></div>}

      <ModalTransition>
        {isOpen && (
          <Modal onClose={() => setIsOpen(false)}>
            <ErrorHeading>Error</ErrorHeading>
            <ErrorSubHeading>Invalid year range entered! Please try again. </ErrorSubHeading>
            <br></br>
          </Modal>
        )}
      </ModalTransition>

    </div>

  )

}