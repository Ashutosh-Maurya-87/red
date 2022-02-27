/* ************************* */
/* ******** ON HOLD ******** */
/* ************************* */

import React from 'react';
import {
  Card,
  Grid,
  Divider,
  Box,
  Button,
  CardActions,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
} from '@material-ui/core';

import {
  MoreVert as MoreVertIcon,
  TableChart as TableChartIcon,
  Close as CloseIcon,
  Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@material-ui/icons';

import './styles.scss';

function SourceTablesTypeSelection() {
  const [datatype, setDatatype] = React.useState('');
  const handleChange = event => {
    setDatatype(event.target.value);
  };
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <Grid
      container
      direction="row"
      justify="flex-start"
      alignItems="flex-start"
    >
      <Card className="card-view">
        <Grid
          className="create-table-box"
          container
          direction="column"
          justify="center"
          alignItems="center"
        >
          <Button
            color="secondary"
            variant="contained"
            onClick={handleClickOpen}
          >
            Create Table
          </Button>
          <Dialog
            className="customized-modal"
            fullWidth
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={open}
          >
            <DialogTitle
              id="customized-dialog-title"
              onClose={handleClose}
              className="modal-title"
            >
              <Grid
                container
                direction="row"
                justify="space-between"
                alignItems="center"
              >
                <Box>Create Table</Box>
                <Box mr={-1}>
                  <IconButton onClick={handleClose}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Grid>
            </DialogTitle>
            <DialogContent>
              <Grid direction="row" container>
                <Grid item xs={5} container direction="row" alignItems="center">
                  <Box m={1}>
                    <Typography variant="button">Table Field Name</Typography>
                  </Box>
                </Grid>
                <Grid item xs={5} container direction="row" alignItems="center">
                  <Box>
                    <Typography variant="button">Data Type</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Grid direction="row" container className="create-dialog-grid">
                <Grid item xs={5} container direction="row" alignItems="center">
                  <DragIndicatorIcon />
                  <Box ml={1}>
                    <Typography display="inline" variant="body1">
                      Account ID
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={5}>
                  <FormControl>
                    <Select
                      value={datatype}
                      onChange={handleChange}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={10}>Alphanumeric</MenuItem>
                      <MenuItem value={20}>Alphanumeric</MenuItem>
                      <MenuItem value={30}>Alphanumeric</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2} container direction="row" justify="flex-end">
                  <IconButton onClick={handleClose} size="small">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
              <Grid direction="row" container className="create-dialog-grid">
                <Grid item xs={5} container direction="row" alignItems="center">
                  <DragIndicatorIcon />
                  <Box ml={1}>
                    <Typography display="inline" variant="body1">
                      Account ID
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={5}>
                  <FormControl>
                    <Select
                      value={datatype}
                      onChange={handleChange}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={10}>Alphanumeric</MenuItem>
                      <MenuItem value={20}>Alphanumeric</MenuItem>
                      <MenuItem value={30}>Alphanumeric</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2} container direction="row" justify="flex-end">
                  <IconButton onClick={handleClose} size="small">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
              <Button
                autoFocus
                onClick={handleClose}
                color="primary"
                startIcon={<AddIcon />}
              >
                Add / Update Column
              </Button>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={handleClose} color="secondary">
                Cancel
              </Button>
              <Button autoFocus onClick={handleClose} color="primary">
                Create
              </Button>
            </DialogActions>
          </Dialog>
          <Box m={2}>
            <Typography variant="subtitle2" display="block">
              OR
            </Typography>
          </Box>
          <Button color="primary" variant="contained">
            Import Table
          </Button>
        </Grid>
      </Card>
      <Card className="card-view">
        <Grid
          className="center-icon"
          container
          direction="row"
          justify="center"
          alignItems="center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="117.929"
            height="100"
            viewBox="0 0 167.929 150"
          >
            <g
              id="Group_1412"
              data-name="Group 1412"
              transform="translate(0 -23.861)"
            >
              <path
                id="Path_833"
                data-name="Path 833"
                d="M161.654,23.861H6.273A6.279,6.279,0,0,0,0,30.134V167.588a6.257,6.257,0,0,0,2.688,5.133v.989H4.937a6.206,6.206,0,0,0,1.336.151H161.654a6.2,6.2,0,0,0,1.332-.151h.308v-.094a6.269,6.269,0,0,0,4.635-6.028V30.136A6.284,6.284,0,0,0,161.654,23.861ZM24.8,168.333H5.808a.874.874,0,0,1-.431-.744V151.3H24.8Zm0-22.409H5.377V128.262H24.8Zm0-23.038H5.377V104.24H24.8Zm0-24.024H5.377V78.692H24.8Zm0-25.548H5.377V53.592H24.8Zm45.271,95.018H30.176V151.3H70.067v17.031Zm0-22.409H30.176V128.262H70.067v17.662Zm0-23.038H30.176V104.24H70.067v18.647Zm0-24.024H30.176V78.692H70.067v20.17Zm0-25.548H30.176V53.592H70.067V73.314Zm0-25.1H30.176V29.237H70.067V48.214Zm45.722,120.119H75.445V151.3h40.344Zm0-22.409H75.445V128.262h40.344Zm0-23.038H75.445V104.24h40.344Zm0-24.024H75.445V78.692h40.344Zm0-25.548H75.445V53.592h40.344Zm0-25.1H75.445V29.237h40.344Zm46.762,119.375a.884.884,0,0,1-.432.744H121.168V151.3h41.383Zm0-21.664H121.168V128.262h41.383Zm0-23.038H121.168V104.24h41.383Zm0-24.024H121.168V78.692h41.383Zm0-25.548H121.168V53.592h41.383Zm0-25.1H121.168V29.237h40.487a.9.9,0,0,1,.9.9V48.214ZM66.068,44.3H33.79V33.069H66.068V44.3Zm45.613.423H79.4V33.492h32.278Zm46.737-.247H126.14V33.245h32.278Z"
                fill="#959595"
              />
            </g>
          </svg>
        </Grid>
        <Divider />
        <CardActions>
          <Grid
            container
            direction="row"
            wrap="nowrap"
            justify="space-between"
            alignItems="center"
          >
            <Typography display="inline" variant="subtitle2" noWrap>
              Live From SpaceLive From SpaceLive From SpaceLive From Space
            </Typography>
            <IconButton aria-label="settings" size="small">
              <MoreVertIcon />
            </IconButton>
          </Grid>
        </CardActions>
      </Card>
      <Card className="card-view">
        <Grid
          className="center-icon"
          container
          direction="row"
          justify="center"
          alignItems="center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="117.929"
            height="100"
            viewBox="0 0 167.929 150"
          >
            <g
              id="Group_1412"
              data-name="Group 1412"
              transform="translate(0 -23.861)"
            >
              <path
                id="Path_833"
                data-name="Path 833"
                d="M161.654,23.861H6.273A6.279,6.279,0,0,0,0,30.134V167.588a6.257,6.257,0,0,0,2.688,5.133v.989H4.937a6.206,6.206,0,0,0,1.336.151H161.654a6.2,6.2,0,0,0,1.332-.151h.308v-.094a6.269,6.269,0,0,0,4.635-6.028V30.136A6.284,6.284,0,0,0,161.654,23.861ZM24.8,168.333H5.808a.874.874,0,0,1-.431-.744V151.3H24.8Zm0-22.409H5.377V128.262H24.8Zm0-23.038H5.377V104.24H24.8Zm0-24.024H5.377V78.692H24.8Zm0-25.548H5.377V53.592H24.8Zm45.271,95.018H30.176V151.3H70.067v17.031Zm0-22.409H30.176V128.262H70.067v17.662Zm0-23.038H30.176V104.24H70.067v18.647Zm0-24.024H30.176V78.692H70.067v20.17Zm0-25.548H30.176V53.592H70.067V73.314Zm0-25.1H30.176V29.237H70.067V48.214Zm45.722,120.119H75.445V151.3h40.344Zm0-22.409H75.445V128.262h40.344Zm0-23.038H75.445V104.24h40.344Zm0-24.024H75.445V78.692h40.344Zm0-25.548H75.445V53.592h40.344Zm0-25.1H75.445V29.237h40.344Zm46.762,119.375a.884.884,0,0,1-.432.744H121.168V151.3h41.383Zm0-21.664H121.168V128.262h41.383Zm0-23.038H121.168V104.24h41.383Zm0-24.024H121.168V78.692h41.383Zm0-25.548H121.168V53.592h41.383Zm0-25.1H121.168V29.237h40.487a.9.9,0,0,1,.9.9V48.214ZM66.068,44.3H33.79V33.069H66.068V44.3Zm45.613.423H79.4V33.492h32.278Zm46.737-.247H126.14V33.245h32.278Z"
                fill="#959595"
              />
            </g>
          </svg>
        </Grid>
        <Divider />
        <CardActions>
          <Grid
            container
            direction="row"
            wrap="nowrap"
            justify="space-between"
            alignItems="center"
          >
            <Typography display="inline" variant="subtitle2" noWrap>
              Live From SpaceLive From SpaceLive From SpaceLive From Space
            </Typography>
            <IconButton aria-label="settings" size="small">
              <MoreVertIcon />
            </IconButton>
          </Grid>
        </CardActions>
      </Card>
      <Card className="card-view">
        <Grid
          className="center-icon"
          container
          direction="row"
          justify="center"
          alignItems="center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="117.929"
            height="100"
            viewBox="0 0 167.929 150"
          >
            <g
              id="Group_1412"
              data-name="Group 1412"
              transform="translate(0 -23.861)"
            >
              <path
                id="Path_833"
                data-name="Path 833"
                d="M161.654,23.861H6.273A6.279,6.279,0,0,0,0,30.134V167.588a6.257,6.257,0,0,0,2.688,5.133v.989H4.937a6.206,6.206,0,0,0,1.336.151H161.654a6.2,6.2,0,0,0,1.332-.151h.308v-.094a6.269,6.269,0,0,0,4.635-6.028V30.136A6.284,6.284,0,0,0,161.654,23.861ZM24.8,168.333H5.808a.874.874,0,0,1-.431-.744V151.3H24.8Zm0-22.409H5.377V128.262H24.8Zm0-23.038H5.377V104.24H24.8Zm0-24.024H5.377V78.692H24.8Zm0-25.548H5.377V53.592H24.8Zm45.271,95.018H30.176V151.3H70.067v17.031Zm0-22.409H30.176V128.262H70.067v17.662Zm0-23.038H30.176V104.24H70.067v18.647Zm0-24.024H30.176V78.692H70.067v20.17Zm0-25.548H30.176V53.592H70.067V73.314Zm0-25.1H30.176V29.237H70.067V48.214Zm45.722,120.119H75.445V151.3h40.344Zm0-22.409H75.445V128.262h40.344Zm0-23.038H75.445V104.24h40.344Zm0-24.024H75.445V78.692h40.344Zm0-25.548H75.445V53.592h40.344Zm0-25.1H75.445V29.237h40.344Zm46.762,119.375a.884.884,0,0,1-.432.744H121.168V151.3h41.383Zm0-21.664H121.168V128.262h41.383Zm0-23.038H121.168V104.24h41.383Zm0-24.024H121.168V78.692h41.383Zm0-25.548H121.168V53.592h41.383Zm0-25.1H121.168V29.237h40.487a.9.9,0,0,1,.9.9V48.214ZM66.068,44.3H33.79V33.069H66.068V44.3Zm45.613.423H79.4V33.492h32.278Zm46.737-.247H126.14V33.245h32.278Z"
                fill="#959595"
              />
            </g>
          </svg>
        </Grid>
        <Divider />
        <CardActions>
          <Grid
            container
            direction="row"
            wrap="nowrap"
            justify="space-between"
            alignItems="center"
          >
            <Typography display="inline" variant="subtitle2" noWrap>
              Live From SpaceLive From SpaceLive From SpaceLive From Space
            </Typography>
            <IconButton aria-label="settings" size="small">
              <MoreVertIcon />
            </IconButton>
          </Grid>
        </CardActions>
      </Card>
      <Card className="card-view">
        <Grid
          className="center-icon"
          container
          direction="row"
          justify="center"
          alignItems="center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="117.929"
            height="100"
            viewBox="0 0 167.929 150"
          >
            <g
              id="Group_1412"
              data-name="Group 1412"
              transform="translate(0 -23.861)"
            >
              <path
                id="Path_833"
                data-name="Path 833"
                d="M161.654,23.861H6.273A6.279,6.279,0,0,0,0,30.134V167.588a6.257,6.257,0,0,0,2.688,5.133v.989H4.937a6.206,6.206,0,0,0,1.336.151H161.654a6.2,6.2,0,0,0,1.332-.151h.308v-.094a6.269,6.269,0,0,0,4.635-6.028V30.136A6.284,6.284,0,0,0,161.654,23.861ZM24.8,168.333H5.808a.874.874,0,0,1-.431-.744V151.3H24.8Zm0-22.409H5.377V128.262H24.8Zm0-23.038H5.377V104.24H24.8Zm0-24.024H5.377V78.692H24.8Zm0-25.548H5.377V53.592H24.8Zm45.271,95.018H30.176V151.3H70.067v17.031Zm0-22.409H30.176V128.262H70.067v17.662Zm0-23.038H30.176V104.24H70.067v18.647Zm0-24.024H30.176V78.692H70.067v20.17Zm0-25.548H30.176V53.592H70.067V73.314Zm0-25.1H30.176V29.237H70.067V48.214Zm45.722,120.119H75.445V151.3h40.344Zm0-22.409H75.445V128.262h40.344Zm0-23.038H75.445V104.24h40.344Zm0-24.024H75.445V78.692h40.344Zm0-25.548H75.445V53.592h40.344Zm0-25.1H75.445V29.237h40.344Zm46.762,119.375a.884.884,0,0,1-.432.744H121.168V151.3h41.383Zm0-21.664H121.168V128.262h41.383Zm0-23.038H121.168V104.24h41.383Zm0-24.024H121.168V78.692h41.383Zm0-25.548H121.168V53.592h41.383Zm0-25.1H121.168V29.237h40.487a.9.9,0,0,1,.9.9V48.214ZM66.068,44.3H33.79V33.069H66.068V44.3Zm45.613.423H79.4V33.492h32.278Zm46.737-.247H126.14V33.245h32.278Z"
                fill="#959595"
              />
            </g>
          </svg>
        </Grid>
        <Divider />
        <CardActions>
          <Grid
            container
            direction="row"
            wrap="nowrap"
            justify="space-between"
            alignItems="center"
          >
            <Typography display="inline" variant="subtitle2" noWrap>
              Live From Space
            </Typography>
            <IconButton aria-label="settings" size="small">
              <MoreVertIcon />
            </IconButton>
          </Grid>
        </CardActions>
      </Card>
      <TableContainer component={Paper} className="list-view-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell component="th">
                <Grid container direction="row" alignItems="center">
                  <TableChartIcon />
                  <Box ml={1}>
                    <Typography display="inline" variant="subtitle2">
                      Live From SpaceLive
                    </Typography>
                  </Box>
                </Grid>
              </TableCell>
              <TableCell>September 12, 2016</TableCell>
              <TableCell>Harpreet Singh</TableCell>
              <TableCell>September 14, 2016</TableCell>
              <TableCell>
                <IconButton aria-label="settings" size="small">
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
}

export default SourceTablesTypeSelection;
