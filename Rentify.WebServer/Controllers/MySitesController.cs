﻿using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using MediatR;
using NExtensions;
using Rentify.WebServer.CommandHandlers;
using Rentify.WebServer.Domain;
using Rentify.WebServer.Extensions;
using Rentify.WebServer.Models;
using Rentify.WebServer.Providers;
using Rentify.WebServer.QueryHandling;

namespace Rentify.WebServer.Controllers
{
    [Authorize]
    public class MySitesController : ApiController
    {
        private readonly IMediator mediatr;
        private readonly IUserProvider userProvider;

        public MySitesController(IMediator mediatr, IUserProvider userProvider)
        {
            this.mediatr = mediatr;
            this.userProvider = userProvider;
        }

        [HttpPost]
        [Route("api/mysites")]
        public async Task<IEnumerable<SiteViewModel>> Get()
        {
            var query = new MySitesQuery(userProvider.UserId);
            var result = await mediatr.SendAsync(query);
            return result.MapTo<SiteViewModel>();
        }

        [HttpPost]
        [Route("api/mysites/add")]
        public async Task<IHttpActionResult> Add(SiteBindingModel model)
        {
            if (ModelState.NotValid())
            {
                return BadRequest(new FailureResult(ModelState).FailureMessage);
            }

            var command = new AddSiteCommand(userProvider.UserId, model.MapTo<RentifySite>());
            var result = await mediatr.SendAsync(command);

            if (result.IsFailure)
                return BadRequest(result.FailureMessage);

            return Ok();
        }

        [HttpDelete]
        [Route("api/mysites/delete")]
        public async Task<IHttpActionResult> Delete(string uniqueId)
        {
            if (!uniqueId.HasValue())
                return BadRequest("You must provide a value for the parameter 'uniqueId'");

            var command = new DeleteSiteCommand(userProvider.UserId, uniqueId);
            var result = await mediatr.SendAsync(command);

            if (result.IsFailure)
                return BadRequest(result.FailureMessage);

            return Ok();
        }
    }
}